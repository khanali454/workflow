export const sendNotification = (notification_text, TargetType = "Project", BoardId, UserId) => {
    let query = `mutation {
        create_notification (user_id: ${UserId}, target_id: ${BoardId}, text: ${notification_text}, target_type: ${TargetType}) {
          text
        }
    }`;
    
}