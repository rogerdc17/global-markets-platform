import uvicorn
from app.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.dp_bind_host,
        port=settings.dp_port,
        reload=False,
        access_log=True,
    )
