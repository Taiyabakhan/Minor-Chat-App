const mongoose=require("mongoose"); 
const chat = require("./models/chat");
main()
    .then(()=>{
         console.log("connection successful");
})
    .catch(err => console.log(err)); 
async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/fakewhatsapp');
}
let allchats=[
    {
        from:"taiyaba",
        to:"anshika",
        msg:"assingmnet kro",
        created_at:new Date()
    },
    {
        from:"sang zhi",
        to:"duan jiaxu",
        msg:"you are my crush isnce childhood",
        created_at:new Date()
    },
    {
        from:"keifer",
        to:"jay jay",
        msg:"if its not you then no one",
        created_at:new Date()
    },
    {
        from:"tony",
        to:"steve",
        msg:"take care",
        created_at:new Date()
    },
];
chat.insertMany(allchats);