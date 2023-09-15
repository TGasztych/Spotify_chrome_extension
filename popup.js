import { client_id, client_secret } from './config.js';
var token = "";
var currentTracks = [];
var currentTracksOnPlaylists = [];
var thisWebpageUrl = ""

document.addEventListener("DOMContentLoaded", function () {
  const analyzeButton = document.getElementById("analyzeButton");
  analyzeButton.addEventListener("click", function () {
    authenticate()
      .then(function () {
        currentTracks = []
        currentTracksOnPlaylists = [];


        // Clear the existing table rows
      clearTable();

        return getTabLink();
      })
      .then(function (currentLink) {
        var apiLink = classifySpotifyLink(currentLink);
        callApi(apiLink);
      })
      .catch(function (error) {
        console.error("Error while getting tab link:", error);
      });
  });
});

function clearTable() {
  var table = document.getElementById("trackTable").getElementsByTagName('tbody')[0];
  while (table.firstChild) {
    table.removeChild(table.firstChild);
  }
}


function getTabLink() {
  return new Promise(function (resolve, reject) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) {
        const currentUrl = tabs[0].url;
        thisWebpageUrl = currentUrl
        console.log("Current webpage URL: " + currentUrl);
        resolve(currentUrl);
      } else {
        reject(new Error("No active tab found"));
      }
    });
  });
}

function classifySpotifyLink(link) {
  if (!link) {
    console.error("Link is undefined");
    return null;
  }

  var parts = link.split("/");
  if (parts.length < 2) {
    console.error("Invalid link format:", link);
    return null;
  }

  var apiLink = "https://api.spotify.com/v1/" + parts[parts.length - 2] + "s/" + parts[parts.length - 1];

  return apiLink;
}

function callApi(apiLink) {

  fetch(apiLink, {
    method: 'GET', // or 'POST' for POST requests
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(response => response.json())
    .then(data => {
      var nextCall = ""
      if("tracks" in data){
        if ("next" in data.tracks) {
          console.log(apiLink,"Obiekt zawiera pole 'next'.", data.tracks.next);
          nextCall = data.tracks.next
          //TO BE IMPLEMENTED
        } else {
          console.log(apiLink,"Obiekt nie zawiera pola 'next'.", data);
        }
      }
      

      console.log(data);
      choosePageType(data, apiLink);
    });
}



function choosePageType(data, apiLink){

    var keyOfData = "name"

    switch (true) {
      case apiLink.includes('/playlists/'):
        console.log('API Link is a Playlist.'); 
        data.tracks.items.forEach(function (item, index) {
          currentTracks.push({
            name: item.track.name,
            id: item.track.id
          });
        });
        
        break;
  
      case apiLink.includes('/tracks/'):
        console.log('API Link is a Track.', dataFromJSON(keyOfData));
        currentTracks.push({
          name: data.name,
          id: data.id
        });


        break;
  
      case apiLink.includes('/albums/'):
        console.log('API Link is an Album.');
        data.tracks.items.forEach(function (item, index) {
          currentTracks.push({
            name: item.name,
            id: item.id
          });
        });

        break;
  
      default:
        console.log('API Link is of an unknown type.');
        break;
    }



    console.log("CURRENT SONGS HERE!!!!!!!!!!", currentTracks)

    compareWithUserData()

}



function compareWithUserData() {
  getUserData()
    .then((jsonData) => {


      //filter out from results the playlist page you see now 
      (jsonData.user.playlists) = jsonData.user.playlists.filter((playlist) => {
        return playlist.playlistHref !== thisWebpageUrl.replace("https://open.spotify.com/", "");
      });


      console.log("compareWithUserData");
      console.log(jsonData);
      currentTracks.forEach(function (track, id) {
        console.log(track.name, id);

        var trackHrefToFind = ("track/" + track.id);
        var matchingPlaylists = findPlaylistsByTrack(trackHrefToFind, jsonData.user.playlists);
        var playlists = [];

        if (matchingPlaylists.length > 0) {
          console.log(`Playlists containing track ${trackHrefToFind}:`);
          matchingPlaylists.forEach((playlistHref) => {
            console.log('track ', track.name, " is on playlist ", playlistHref);
        
            // Find corresponding playlist name 
            var thisPlaylistsName = findPlaylistName(playlistHref, jsonData.user.playlists);
        
            playlists.push({ playlistHref: playlistHref, playlistNames: thisPlaylistsName });
          });
        } else {
          console.log(`No playlists containing track ${trackHrefToFind} found.`);
        }
        

        currentTracksOnPlaylists.push({ trackName: track.name, trackHref: track.id, playlists: playlists });

        // Add the track data to the table
        addToTable(track.name, track.id, playlists);
        
      });
    })
    .catch((error) => {
      console.error("Error while getting user data:", error);
    });
}

function findPlaylistName(playlistHref, playlistsData) {
  const playlist = playlistsData.find((playlist) => playlist.playlistHref === playlistHref);
  return playlist ? playlist.playslitName : "Name not found";
}


function addToTable(trackName, trackHref, playlists) {
  var table = document.getElementById("trackTable").getElementsByTagName('tbody')[0];
  var newRow = table.insertRow(table.rows.length);
  var cell1 = newRow.insertCell(0);
  var cell2 = newRow.insertCell(1);

  
// Initially, update the table based on the default checkbox state
updateTableBasedOnCheckbox();

  // Construct the complete url
  var spotifyUrl = 'https://open.spotify.com/track/' + trackHref;

  // Create a clickable link for the trackName
  var trackLink = document.createElement('a');
  trackLink.href = spotifyUrl 
  trackLink.target = '_blank' // Open link in a new tab
  trackLink.textContent = trackName
  cell1.appendChild(trackLink)

  

  // Create clickable links for playlist names
  var playlistLinks = playlists.map(playlist => {
    var playlistLink = document.createElement('a');
    playlistLink.href = 'https://open.spotify.com/' + playlist.playlistHref; 
    playlistLink.target = '_blank'; // Open link in a new tab
    playlistLink.textContent = playlist.playlistNames;
    return playlistLink;
  });

  // Append the playlist links to cell2
  playlistLinks.forEach(playlistLink => {
    cell2.appendChild(playlistLink);
    cell2.appendChild(document.createElement('br'));
  });
}






function findPlaylistsByTrack(trackHrefToFind, playlistsData) {
  const matchingPlaylists = [];

  playlistsData.forEach((playlist) => {
    if (playlist.trackHrefList.includes(trackHrefToFind)) {
      matchingPlaylists.push(playlist.playlistHref);
    }
  });

  return matchingPlaylists;
}


// Add an event listener to the checkbox
const showPlaylistsCheckbox = document.getElementById("showPlaylists");
showPlaylistsCheckbox.addEventListener("change", updateTableBasedOnCheckbox);

// Function to update the table based on the checkbox state
function updateTableBasedOnCheckbox() {
  const table = document.getElementById("trackTable");
  const rows = table.getElementsByTagName("tbody")[0].getElementsByTagName("tr");

  const showOnlyNonEmptyPlaylists = showPlaylistsCheckbox.checked;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const playlistsCell = row.cells[1]; // Assuming the "Playlists" column is the second column

    if (showOnlyNonEmptyPlaylists) {
      // Show the row if the playlists cell is not empty
      row.style.display = playlistsCell.textContent.trim() === "" ? "none" : "";
    } else {
      // Show all rows
      row.style.display = "";
    }
  }
}







function getUserData() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['userData'], function (result) {
      const jsonData = result.userData;

      if (jsonData) {
        // Parse the JSON string into a JavaScript object
        const parsedData = JSON.parse(jsonData);

        // Now, you can use the parsedData object as needed
        console.log('Data from storage:', parsedData);
        resolve(parsedData);
      } else {
        console.log('No data found in storage');
        reject(new Error('No data found in storage'));
      }
    });
  });
}



function dataFromJSON(jsonObject, keyOfData){
  return jsonObject[keyOfData]
}

function findKeyInJSON(jsonObject, targetKey) {
  let result = null;

  function searchObject(obj, key) {
      for (const currentKey in obj) {
          if (currentKey === key) {
              result = obj[currentKey];
              break;
          } else if (typeof obj[currentKey] === 'object') {
              searchObject(obj[currentKey], key);
          }
      }
  }

  searchObject(jsonObject, targetKey);

  return result;
}




function authenticate() {
  var authOptions = {
      method: 'POST',
      headers: {
          'Authorization': 'Basic ' + btoa(client_id + ':' + client_secret),
          'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
  };

  return fetch('https://accounts.spotify.com/api/token', authOptions)
      .then(response => response.json())
      .then(data => {
          if (data.access_token) {
              //console.log("JSON RESPONSE:");
              //console.log(data);
              token = data.access_token;
              //console.log("JSON RESPONSE TOKEN:");
              //console.log(token);
          } else {
              throw new Error("Error while obtaining access token: " + data.error);
          }
      });
}
