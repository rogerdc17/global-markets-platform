from app.database import backup_database, init_db

if __name__ == "__main__":
    init_db()
    path = backup_database()
    print(f"Backup created: {path}")
