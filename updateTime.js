
function updateTimeSinceLastUpdate() {
    chrome.storage.local.get(['userData'], function (result) {
      const jsonData = result.userData;
  
      if (jsonData) {
        const parsedData = JSON.parse(jsonData);
        console.log("!!!!!!!!!!!!!!!!!!!TIME!!!!!!!!!!!!!", parsedData.timestamp);
  
        const lastUpdateTime = new Date(parsedData.timestamp);
  
        const currentTime = new Date();
        const timeDifference = Math.floor((currentTime - lastUpdateTime)/1000);
        
        
        
        const timeDisplay = document.getElementById("timeDisplay");
        timeDisplay.textContent = `Last updated: ${formatTimeDifference(timeDifference)} ago`;
      } else {
        console.log('No data found in storage');
      }
    });
  }

  function formatTimeDifference(timeDifference) {
    let result;
    if (timeDifference < 60) {
      result = `${timeDifference} second${timeDifference !== 1 ? 's' : ''}`;
    } else if (timeDifference < 3600) {
      const minutes = Math.floor(timeDifference / 60);
      result = `${minutes} minuste${minutes !== 1 ? 's' : ''}`;
    } else if (timeDifference < 86400) {
      const hours = Math.floor(timeDifference / 3600);
      result = `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(timeDifference / 86400);
      result = `${days} day${days !== 1 ? 's' : ''}`;
    }
    return result;
  }
  
  document.addEventListener("DOMContentLoaded", updateTimeSinceLastUpdate);
  
  const updateButton = document.getElementById("updateButton");
  updateButton.addEventListener("click", function () {
    const timeDisplay = document.getElementById("timeDisplay");
        timeDisplay.textContent = `Updated`;
  });
  