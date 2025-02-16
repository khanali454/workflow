const express = require('express');
require('dotenv').config()
const axios = require('axios');
var bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');
const AutomationModel = require('./models/Automation');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.listen(PORT, () => {
    console.log(`server listening on port ${PORT}`);
});



const sendNotification = (notification_text, TargetType = "Project", BoardId, UserId,tokenis) => {
    let query = `mutation {
        create_notification (user_id: ${UserId}, target_id: ${BoardId}, text: ${notification_text}, target_type: ${TargetType}) {
          text
        }
    }`;
    axios.post('https://api.monday.com/v2', { query }, {
      headers: {
        'Authorization': `Bearer ${tokenis}`
      }
    }).then((response) => {
      console.log("response webhook created : ", response);
    });
}

// app.post("/webhook", function (req, res) {
//     console.log(JSON.stringify(req.body, 0, 2));
//     var boardId = req.body.event.boardId;
//     var columnId = req.body.event.columnId;
//     var currentValue = req.body.event.value.label.text;
//     var previousValue = req.body.event.previousValue.label.text;
//     console.log("boardId : ", boardId);
//     console.log("columnId : ", columnId);
//     console.log("currentValue : ", currentValue);
//     console.log("previousValue : ", previousValue);

//     // find item
//     AutomationModel.findOne({ board_id: `${boardId}`,columnId:`${columnId}`})
//     .then((rep) => {
//          console.log("rep : ", rep);
//          if(rep?.columnValue==currentValue || rep?.columnValue=="Anything"){
//             console.log("condition true");
//             let notification = rep?.notification;
//             rep?.users.forEach((user)=>{
//                 let query = `mutation {
//                     create_notification (user_id: ${user?.id}, target_id: ${boardId}, text: ${notification}, target_type: "Project") {
//                       text
//                     }
//                 }`;
//                 axios.post('https://api.monday.com/v2', { query }, {
//                   headers: {
//                     'Authorization': `Bearer ${rep?.token}`
//                   }
//                 }).then((response) => {
//                   console.log("response notification : ", response);
//                 });
//             });
//             res.status(200).send(req.body);
//          }else {
//             console.log("Condition not met: rep?.columnValue: ", rep?.columnValue, ", currentValue: ", currentValue);
//             res.status(200).send(req.body);
//         }
//         })
//         .catch((err) => console.error("Query Error:", err));
// });

app.post("/webhook", async function (req, res) {
    console.log(JSON.stringify(req.body, 0, 2));
    var boardId = req.body.event.boardId;
    var columnId = req.body.event.columnId;
    var currentValue = req.body.event.value.label.text;
    var previousValue = req.body.event.previousValue.label.text;
    console.log("boardId : ", boardId);
    console.log("columnId : ", columnId);
    console.log("currentValue : ", currentValue);
    console.log("previousValue : ", previousValue);

    try {
        // find item
        const rep = await AutomationModel.findOne({ board_id: `${boardId}`, columnId: `${columnId}` });
        console.log("rep : ", rep);

        if (rep?.columnValue == currentValue || rep?.columnValue == "Anything") {
            console.log("condition true");
            let notification = rep?.notification;

            // Create an array of promises for the notifications
            const notificationPromises = rep?.users.map(async (user) => {
                const safeNotificationText = notification.replace(/"/g, '\\"');  // Escape double quotes

                const query = `
                    mutation {
                        create_notification(user_id: ${user?.id}, target_id: ${boardId}, text: "${safeNotificationText}", target_type: "Project") {
                            text
                        }
                    }
                `;
            
                return axios.post('https://api.monday.com/v2', { query: query }, {
                    headers: {
                        'Authorization': `Bearer ${rep?.token}`,
                        'Content-Type': 'application/json'
                    }
                })
                .then((response) => {
                    console.log("Response notification:", response.data);
                })
                .catch((error) => {
                    console.error("Error creating notification:", error);
                });
            });
            
            // If you want to wait for all notifications to complete:
           await Promise.all(notificationPromises)
                .then(() => {
                    console.log('All notifications sent successfully');
                })
                .catch(() => {
                    console.error('Error sending one or more notifications');
                });
            

           
            // Send response to Monday.com after all notifications are sent
            res.status(200).send(req.body);
        } else {
            console.log("Condition not met: rep?.columnValue: ", rep?.columnValue, ", currentValue: ", currentValue);
            res.status(200).send(req.body);
        }

    } catch (err) {
        console.error("Query Error:", err);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/create/automation', async (req, resp) => {
    let boardId = req.body.boardId;
    let token = req.body.token;
    let notification = req.body.notification;
    let columnId = req.body.columnId;
    let columnValue = req.body.columnValue;
    let template = req.body.template;
    let users = req.body.users;
    let columnType = req.body.columnType;

    // Check for missing required fields
    if (!boardId || !notification || !columnId || !columnValue || !template || !users || !columnType) {
        return resp.status(400).json({ success: false, msg: "All fields are required" });
    }

    try {
        // Create a filter to check if the automation already exists
        const filter = {
            board_id: boardId,
            columnId: columnId,
            columnType: columnType,
            columnValue: columnValue
        };

        // Find the existing automation or create a new one if not found
        await AutomationModel.findOneAndUpdate(filter, {
            $set: {
                template: template,
                token: token,
                board_id: boardId,
                notification: notification,
                columnType: columnType,
                columnId: columnId,
                columnValue: columnValue,
                users: users,
            }
        }, {
            upsert: true, // This ensures it creates a new entry if it doesn't exist
            new: true, // This will return the updated document after the update or insert operation
        });

        resp.json({ success: true, msg: 'Automation Created or Updated Successfully!' });

    } catch (err) {
        // If an error occurs, return a response with the error message
        console.error(err);
        resp.status(500).json({ success: false, msg: 'Server Error', error: err.message });
    }
});


app.delete('/delete/automation', async (req, res) => {
    let automationId = req.body.automationId;  // ObjectId of the automation to delete

    // Check if automationId is provided
    if (!automationId) {
        return res.status(400).json({ success: false, msg: "Automation ID is required" });
    }

    try {
        // Delete the automation by its ObjectId
        const deletedAutomation = await AutomationModel.findByIdAndDelete(automationId);

        if (deletedAutomation) {
            // If automation is found and deleted
            res.json({ success: true, msg: 'Automation Deleted Successfully!' });
        } else {
            // If no automation is found to delete
            res.status(404).json({ success: false, msg: 'Automation not found' });
        }

    } catch (err) {
        // Handle any errors during the deletion process
        console.error("Error deleting automation:", err);
        res.status(500).json({ success: false, msg: 'Server Error', error: err.message });
    }
});


app.get('/automations', async (req, res) => {
    try {
        // Get the board_id from the query parameter
        const boardId = req.query.board_id;

        // If a board_id is provided, filter automations by board_id
        let query = {};
        if (boardId) {
            query.board_id = boardId;
        }

        // Fetch automations based on the filter
        const automations = await AutomationModel.find(query);

        res.status(200).json({ success: true, data: automations });
    } catch (err) {
        console.error("Error loading automations:", err);
        res.status(500).json({ success: false, msg: "Failed to load automations" });
    }
});



app.post('/access/token', (req, resp) => {
    let code = req.body.code;
    axios.post('https://auth.monday.com/oauth2/token', {
        code: code,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET
    }).then((response) => {
        console.log("response : ", response);
        resp.json(response?.data);
    }, (error) => {
        resp.status(401).json({ error: "Authorization failed , Please try again" })
        console.log("error : ", error);
    });
})
