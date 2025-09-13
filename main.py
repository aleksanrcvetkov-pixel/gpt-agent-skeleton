from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello, world!"}
@app.get("/about")
def about():
    return {"info": "Это мой первый FastAPI проект на GitHub!"}
