var customerData;
var table;
var tableArray =  new Array();
var makersLayer;
var mymap;
var changes = false;

var tilesAPI = '';
var nominatimAPI = '';


function main() {
  //set the filename after choosen something in the upload -- works global on this site
  $(".custom-file input").change(function (e) {
    var files = [];
    for (var i = 0; i < $(this)[0].files.length; i++) {
      files.push($(this)[0].files[i].name);
    }
    $(this).next(".custom-file-label").html(files.join(", "));
  });

  console.log("Startup Auswertungstool complete");

    function getAPIsettings() {
        $.ajax({
            url: "http://localhost:7000/api/getApiSettings",
            dataType: "json",
            success: function (jsonData) {
                //console.warn(jsonData);
                tilesAPI = jsonData.KartenTiles;
                nominatimAPI = jsonData.Nominatim;
                //map functions
                //initialize the map
                mymap = L.map("timeSlider").setView([50, 13], 5);
                L.tileLayer(tilesAPI + "/{z}/{x}/{y}.png", {
                    attribution:
                        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                }).addTo(mymap);

                //set popups when click somewhere on the map

                var popup = L.popup(customOptions);

                var markedlatlon = { lat: "", lon: "" };
                function onMapClick(e) {
                    //console.warn("clicked on map ", e);
                    markedlatlon.lat = e.latlng.lat;
                    markedlatlon.lon = e.latlng.lng;
                    popup
                        .setLatLng(e.latlng)
                        .setContent(
                            "<div class='text-center'><h6>Koordinaten an dieser Position</h6> <b>Latitude:  </b>" +
                            e.latlng.lat +
                            "<br><b>Longitude:  </b>" +
                            e.latlng.lng +
                            //"<hr class='style1'></div>" +
                            "<button type='button' id='zoomto' class='btn-xs btn-warning btn-block'>Diese Position bei markierten Abn. setzen</button>"
                        )
                        .openOn(mymap);
                }

                mymap.on("click", onMapClick);

                $(document).on("click", "#zoomto", function () {
                    setTheLatLonNew(markedlatlon);
                });

                $(document).on("click", "#abn1", function () {
                    delLatLon();
                });

                markersLayer = new L.FeatureGroup(); //layer contain searched elements
                mymap.addLayer(markersLayer);

                //get the table data
                getCustomers();

                L.easyButton("fa-compress-arrows-alt", function (btn, map) {
                    var bounds = markersLayer.getBounds();
                    map.flyToBounds(bounds, { padding: [20, 20] });
                }).addTo(mymap);
            },
            error: function (jsonData) {
                console.warn("ERROR in getApiSetting");
            },
        });
    }
    getAPIsettings();
}

//check the connection to the Influx DB
function getInfoDB() {
  $.ajax({
    url: "http://localhost:7000/api/getInfo",
    dataType: "json",
    success: function (jsonData) {
      console.log('success', jsonData);
      $("#pi").text(jsonData.pn);
      $("#ki").text(jsonData.howManyCu);
      $("#di").text(jsonData.dataI);
      if(jsonData.pn !== "") {
        $("#loadedProjectName").text("Projekt: " + jsonData.pn);
      }

    },
    error: function (jsonData) {
      $("#pi").text("ERROR");
      $("#ki").text("0");
      $("#di").text("0");
    },
  });
}
//get infos from db if something is already there to work with
getInfoDB();

/*---------------------------------------*/
//DB connection Test
var colorRed = "#dc3545";
var colorGreen = "#28a745";
var colorYellow = "#ffc107";

//check the connection to the Influx DB
function checkDB() {
  $.ajax({
    url: "http://localhost:7000/api/checkInfluxDBConn",
    dataType: "json",
    success: function (jsonData) {
      //set the icon and text
      if (jsonData.status === "OK") {
        $("#dbIcon").css("color", colorGreen);
        $("#dbText").text("Datenbank OK");
        //also the backend ok
        $("#sIcon").css("color", colorGreen);
        $("#sText").text("Backend OK");
      } else if (jsonData.status === "NOT") {
        $("#dbIcon").css("color", colorRed);
        $("#dbText").text("Datenbank FEHLER");
        //the backend ok
        $("#sIcon").css("color", colorGreen);
        $("#sText").text("Backend OK");
      } else {
        $("#dbIcon").css("color", colorRed);
        $("#dbText").text("Datenbank FEHLER");
        //backend NOT OK
        $("#sIcon").css("color", colorRed);
        $("#sText").text("Backend FEHLER");
      }
      $("#vawt").text("Version " + jsonData.versionAWT);
    },
    error: function (jsonData) {
      $("#dbIcon").css("color", colorRed);
      $("#dbText").text("Datenbank FEHLER");
      //backend NOT OK
      $("#sIcon").css("color", colorRed);
      $("#sText").text("Backend FEHLER");
    },
  });
}
//check DB at startup
checkDB();

window.setInterval(function () {
  checkDB();
}, 10000);
//DB connection Test
/*---------------------------------------*/

// TESTSTUFF
function fetchUsers() {
  var xhttp = new XMLHttpRequest();
  xhttp.open("GET", "http://localhost:7000/api/users", true);
  xhttp.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 200) {
      console.log(this.responseText);
      //alert(this.responseText);
    }
  };
  xhttp.send();
}

/*
function testCall() {
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "http://localhost:7000/api/testCallSend", true);
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            console.log(this.responseText);
            //alert(this.responseText);
        }
    };
    xhttp.send(params);
}
*/

function testCall1() {
  $.post("http://localhost:7000/api/testCallSend", params, function (data) {
    console.warn(data);
  });
}

function testCall() {
  let file1 = document.getElementById("csv1upload").files[0];

  //read the json from the selected input field
  var reader = new FileReader();
  reader.onload = onReaderLoad;
  reader.readAsText(file1);

  function onReaderLoad(event) {
    //data1 = JSON.parse(event.target.result);
    data1 = event.target.result; //send as text is much faster to the server as as parsed JSON

    console.log("Finished parsing data 1");

    /*
        $.post("http://localhost:7000/api/writeJSONtoInfluxDB", data1, function (data) {
            console.warn(data);
        });
        */

    $.ajax({
      url: "http://localhost:7000/api/writeJSONtoInfluxDB",
      type: "POST",
      contentType: "application/json", // <====
      data: data1,
      async: false,
      success: function (data) {
        console.warn(data);
      },
    });

    console.warn("fertig");
  }
}

/*
//get Data //WORKING UND EINFACHER !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
function testCall() {
    $.getJSON('http://localhost:7000/api/testCall', function (jsonData) {
        console.log(jsonData);
    });
}
*/

/*
//send Data and get something back
function testCall() { //start and endtimemissing
    var data = "hello TestString";

    $.ajax({
        url: 'http://localhost:7000/api/testCall',
        type: 'put',
        data: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json"
        },
        dataType: 'json',
        success: function () {
            console.warn("Data send to Server");
            //get something back possible?
        },
        error: function () {
            //return false;
            console.warn("error im senden");
        }
    });
}
*/

/**
 * when DOM ready load the main function
 */
$(document).ready(main);
