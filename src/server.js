import express from 'express';
import bodyParser from 'body-parser';
import {MongoClient} from 'mongodb';
import path from 'path';


const app=express();
app.use(express.static(path.join(__dirname,'build')));
app.use(bodyParser.json());

const withDB=async(operations,res)=>{

    try {
        const client = await MongoClient.connect(' mongodb://127.0.0.1:27017/', { useNewUrlParser: true });
        const db = client.db('my-app');

        await operations(db);
      
        client.close();
    } catch (error) {
        console.log(error);
    }
}

app.get('/api/articles/:name/', async (req, res) => {
    
        const articleName=req.params.name;
        withDB(async(db)=>{
            const articleInfo = await db.collection('articles').findOne({name:articleName});
            res.status(200).json(articleInfo);
        },res);


})
app.post('/api/articles/:name/upvote', async (req, res) => {
    const articleName=req.params.name;
    withDB(async(db)=>{
        const articleInfo = await db.collection('articles').findOne({name:articleName});
        await db.collection('articles').updateOne({name:articleName},{
            '$set': {upvotes: articleInfo.upvotes + 1}
        }
        );
        const updatedArticleInfo=await db.collection('articles').findOne({name:articleName});
        res.status(200).json(updatedArticleInfo);
    }
    ,res);

})
app.post('/api/articles/:name/comment', async (req, res) => {
    const {username,comment}=req.body;
    const articleName=req.params.name;
    withDB(async(db)=>{
        await db.collection('articles').updateOne({name:articleName},{
            '$push': {comments: {username:username,comment:comment}}
        }
        );
        const updatedArticleInfo=await db.collection('articles').findOne({name:articleName});
        res.status(200).json(updatedArticleInfo);
    }
        ,res);
    
})

app.get('*',(req,res)=>{
    res.sendFile(path.join(__dirname + '/build/index.html'));
});

app.listen(8000, () => console.log('Listening on port 8000'));