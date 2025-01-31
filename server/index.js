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

app.get("/", function () {
    return 'hello world';
})
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
    AutomationModel.findOne({ board_id: boardId, columnId: columnId }).then(auto => {
        console.log("automation data : ", auto);
    }).catch((err) => {
        console.log("err : ", err);
    });
    res.status(200).send(req.body);

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
        board_id: boardId,
        columnType: columnType,
        columnId: columnId,
        columnValue: columnValue,
        users: users,
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
