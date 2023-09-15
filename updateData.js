var token = "token";
import { client_id, client_secret, mySpotifyUserId } from './config.js';
const playlistData = [];

document.addEventListener('DOMContentLoaded', function () {
    const updateButton = document.getElementById('updateButton');
    updateButton.addEventListener('click', function () {
        runDataFetch();
    });
});

function runDataFetch() {
    extractedDataFull = [];
    console.log("AUTHENTICATION STARTED:");
    playlistData.splice(0, playlistData.length);
    
    // Authenticate and then fetch playlists
    authenticate()
        .then(() => getPlaylists())
        .catch(error => {
            console.error("Error while obtaining access token:", error);
        });
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
                console.log("JSON RESPONSE:");
                console.log(data);
                token = data.access_token;
                console.log("JSON RESPONSE TOKEN:");
                console.log(token);
            } else {
                throw new Error("Error while obtaining access token: " + data.error);
            }
        });
}


function getPlaylists(){
    console.log("token w getPlaylists = " + JSON.stringify(token));
    var mySpotifyUserLink = ('https://api.spotify.com/v1/users/'+mySpotifyUserId+'/playlists')
    console.log("mySpotifyUserLink",mySpotifyUserLink)
    fetch(mySpotifyUserLink, {
        method: 'GET', 
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log(JSON.stringify(data));

        console.log(data)
        if ("next" in data) {
            console.log("Obiekt zawiera pole 'next'.", data.next);
            //callApi(data.tracks.next)
            //TO BE IMPLEMENTED
          } else {
            console.log("Obiekt nie zawiera pola 'next'.", data);
          }
          
        


       
    
        // Iterate through the "items" array and extract "href" and "name"
        data.items.forEach(item => {
            const playlistInfo = {
                name: item.name,
                href: item.href
            };
            playlistData.push(playlistInfo);
            getPlaylistTracks(item.name, item.href)
        });

        // Log the playlistData array to inspect its contents
        console.log("Playlist Data:", playlistData);
        // handle the API response data here

        
        
    })
    .catch(error => {
        // handle errors here
    });
}



function getPlaylistTracks(name, href){
    
    console.log(name)
    console.log(href)

    fetch(href+'/tracks', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        //TO BE IMPLEMENTED
        /*
            console.log("++++++++++++++++++++++", data)
        if ("next" in data) {
            console.log("Obiekt zawiera pole 'next'.", data.next);
            //callApi(data.tracks.next)
            //TO BE IMPLEMENTED
          } else {
            console.log("Obiekt nie zawiera pola 'next'.", data);
          }
        */
        
        console.log(data);
        saveToJSON(name, href, data)

        
    })
    .catch(error => {
    });
}



var extractedDataFull = []

function saveToJSON(playslitName, playlistHref, data){
    var trackHref = ""
    var trackHrefList = []
    
    console.log("PLAYLIST")
    console.log("playslitName", playslitName);
    console.log("playlistHref", playlistHref);

    data.items.forEach(item => {
        trackHref = item.track.href
        console.log("ITEM", item);
        console.log("trackHref", trackHref);
        trackHrefList.push(shortenHref(trackHref))
      });

      var extractedData = {
        playslitName: playslitName,
        playlistHref: shortenHref(playlistHref),
        trackHrefList: trackHrefList
      }
      extractedDataFull.push(extractedData)
      console.log("extractedDataFull:::::", extractedDataFull)


      const jsonData = {
        user: {[`playlists`]: extractedDataFull},
        timestamp: Date.now()
      };
  
      const jsonString = JSON.stringify(jsonData);
  

      chrome.storage.local.set({ 'userData': jsonString }, function () {
        if (chrome.runtime.lastError) {
            console.error('Error while saving data:', chrome.runtime.lastError);
          } else {
                  console.log('Data saved to storage:', jsonData);
            showMeTheJson()
          }
        });
    
}



function shortenHref(inputText) {
    
    var parts = inputText.split("/");
    var shortenedValue = parts[parts.length - 2].slice(0, -1)+"/"+parts[parts.length - 1];
  
    return shortenedValue;
  }



function showMeTheJson(){
    chrome.storage.local.get(['userData'], function (result) {
        const jsonData = result.userData;
      
        if (jsonData) {
          const parsedData = JSON.parse(jsonData);
      
          console.log('Data from storage:', parsedData);
      
          console.log('Name:', parsedData.user.name);
          console.log('Age:', parsedData.user.age);
        } else {
          console.log('No data found in storage');
        }
      });
      

}

