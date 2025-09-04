from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import os
from dotenv import load_dotenv

# Load env vars
load_dotenv()

# Alembic Config object
config = context.config

# Override with DATABASE_URL from env
DATABASE_URL = os.getenv("DATABASE_URL", config.get_main_option("sqlalchemy.url"))
config.set_main_option("sqlalchemy.url", DATABASE_URL)

# Interpret logging config file
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import your models
from src.app import Base  # our SQLAlchemy Base
target_metadata = Base.metadata

# Run migrations offline
def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()

# Run migrations online
def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
