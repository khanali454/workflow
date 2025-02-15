const express = require('express');
require('dotenv').config()
const axios = require('axios');
var bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');
const AutomationModel = require('./models/Automation');
const app = express();
const PORT = process.env.PORT || 8080;

const session = require("express-session");
const cookieParser = require("cookie-parser");

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.listen(PORT, () => {
    console.log(`server listening on port ${PORT}`);
});

// Initialization
app.use(cookieParser());

app.use(session({
    secret: "token",
    saveUninitialized: true,
    resave: true
}));

const sendNotification = (notification_text, TargetType = "Project", BoardId, UserId,token) => {
    let query = `mutation {
        create_notification (user_id: ${UserId}, target_id: ${BoardId}, text: ${notification_text}, target_type: ${TargetType}) {
          text
        }
    }`;
    axios.post('https://api.monday.com/v2', { query }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).then((response) => {
      console.log("response webhook created : ", response);
    });
}

app.post("/webhook", function (req, res) {
    console.log(JSON.stringify(req.body, 0, 2));
    var boardId = req.body.event.boardId;
    var columnId = req.body.event.columnId;
    var currentValue = req.body.event.value.label.text;
    var previousValue = req.body.event.previousValue.label.text;
    console.log("boardId : ", boardId);
    console.log("columnId : ", columnId);
    console.log("currentValue : ", currentValue);
    console.log("previousValue : ", previousValue);

    // find item
    AutomationModel.findOne({ board_id: `${boardId}`,columnId:`${columnId}`})
    .then((rep) => {
         console.log("rep : ", rep);
         if(rep?.columnValue==currentValue || rep?.columnValue=="Anything"){
            let notification = rep?.notification;
            rep?.users.forEach((user)=>{
                sendNotification(notification,"Project",boardId,user?.id,token);
            });
         }
         res.status(200).send(req.body);
        })
        .catch((err) => console.error("Query Error:", err));
});
app.post('/create/automation', (req, resp) => {
    let boardId = req.body.boardId;
    let notification = req.body.notification;
    let columnId = req.body.columnId;
    let columnValue = req.body.columnValue;
    let template = req.body.template;
    let users = req.body.users;
    let columnType = req.body.columnType;

    if (!boardId || !notification || !columnId || !columnValue || !template || !users || !columnType) {
        resp.status(200).json({ success: false, msg: "All fields are required" });
    }

    const filter = {
        board_id: {$eq:`${boardId}`},
        columnType: {$eq:`${columnType}`},
        columnId: {$eq:`${columnId}`},
        columnValue: {$eq:`${columnValue}`},
        users: {$eq:users},
    };

    AutomationModel.findOneAndUpdate(filter, {
        $set: {
            template: template,
            board_id: boardId,
            notification: notification,
            columnType: columnType,
            columnId: columnId,
            columnValue: columnValue,
            users: users,
        }
    }, {
        upsert: true
    }).then(() => {
        resp.json({ success: true, msg: 'Automation Created Successfully!' });
    })
})


app.get('/automations', async (req, res) => {
    try {
        const automations = await AutomationModel.find();
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
        req.session.access_token = resp?.data?.access_token;
        req.session.save();
        resp.json(response?.data);
    }, (error) => {
        resp.status(401).json({ error: "Authorization failed , Please try again" })
        console.log("error : ", error);
    });
})
