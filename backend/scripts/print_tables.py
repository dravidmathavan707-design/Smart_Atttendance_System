from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv
import os

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))
inspector = inspect(engine)
print(inspector.get_table_names())
