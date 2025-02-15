const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.ObjectId;
const automationSchema = new mongoose.Schema({
    _id: ObjectId,
    template: String,
    token: String,
    board_id: String,
    notification: String,
    columnType: String,
    columnId: String,
    columnValue: String,
    users: [
        {
            id: String,
            is_admin: Boolean,
            is_guest: Boolean,
            email: String
        }
    ],
    date: { type: Date, default: Date.now },
},{strict:false});
const AutomationModel = mongoose.model('Automation', automationSchema);
module.exports = AutomationModel;