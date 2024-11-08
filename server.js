require("dotenv").config();
const twilio = require("twilio");
const fs = require("fs");
const https = require("https");
const path = require("path");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);

// Define the filters
const toPhoneNumber = "+14439406252"; // Replace with the desired "To" phone number
const startDate = " 2024-10-07"; // Replace with the desired start date (YYYY-MM-DD)
const endDate = " 2024-11-07"; // Replace with the desired end date (YYYY-MM-DD)

async function fetchCallLogs() {
  try {
    const calls = await client.calls.list({
      // to: toPhoneNumber,
      from: "+14437376724",
      // startTimeAfter: new Date(startDate),
      // startTimeBefore: new Date(endDate),
      status: "completed",
      limit: 200,
    });

    for (const call of calls) {
      console.log(call.sid, call.from, call.to, call.status);
      await fetchAndDownloadRecordings(call.sid);
    }
  } catch (error) {
    console.error("Error fetching call logs:", error);
  }
}

async function fetchAndDownloadRecordings(callSid) {
  try {
    const recordings = await client.recordings.list({ callSid: callSid });
    for (const recording of recordings) {
      console.log(`Fetching recordings for call ${callSid}`);
      const recordingUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recording.sid}.mp3`;
      const filePath = path.join(
        __dirname,
        "recordings",
        `${recording.sid}.mp3`
      );
      downloadRecording(recordingUrl, filePath);
    }
  } catch (error) {
    console.error(`Error fetching recordings for call ${callSid}:`, error);
  }
}

function downloadRecording(url, filePath) {
  const file = fs.createWriteStream(filePath);
  https
    .get(url, (response) => {
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        console.log(`Downloaded recording to ${filePath}`);
      });
    })
    .on("error", (error) => {
      fs.unlink(filePath);
      console.error(`Error downloading recording from ${url}:`, error);
    });
}

fetchCallLogs();
