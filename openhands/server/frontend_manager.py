import os
import shutil
import subprocess
from pathlib import Path

from openhands.core.logger import openhands_logger as logger
from openhands.server.config.server_config import FrontendType


class FrontendManager:
    """
    Manages the frontend selection and building process.
    """

    DEFAULT_FRONTEND_DIR = './frontend/build'
    BOLT_DIY_REPO = 'https://github.com/stackblitz-labs/bolt.diy.git'
    BOLT_DIY_DIR = './bolt_diy'
    BOLT_DIY_BUILD_DIR = './bolt_diy/dist'

    @classmethod
    def get_frontend_directory(cls, frontend_type: FrontendType) -> str:
        """
        Returns the directory path for the selected frontend.
        
        Args:
            frontend_type: The type of frontend to use
            
        Returns:
            The directory path for the selected frontend
        """
        if frontend_type == FrontendType.DEFAULT:
            return cls.DEFAULT_FRONTEND_DIR
        elif frontend_type == FrontendType.BOLT_DIY:
            # Ensure bolt.diy is cloned and built
            if not os.path.exists(cls.BOLT_DIY_BUILD_DIR):
                cls.setup_bolt_diy()
            return cls.BOLT_DIY_BUILD_DIR
        else:
            logger.warning(f"Unknown frontend type: {frontend_type}. Using default.")
            return cls.DEFAULT_FRONTEND_DIR

    @classmethod
    def setup_bolt_diy(cls) -> None:
        """
        Clones and builds the bolt.diy frontend if it doesn't exist.
        """
        logger.info("Setting up bolt.diy frontend...")
        
        # Clone the repository if it doesn't exist
        if not os.path.exists(cls.BOLT_DIY_DIR):
            logger.info(f"Cloning bolt.diy repository from {cls.BOLT_DIY_REPO}...")
            try:
                subprocess.run(
                    ["git", "clone", cls.BOLT_DIY_REPO, cls.BOLT_DIY_DIR],
                    check=True,
                )
                logger.info("bolt.diy repository cloned successfully.")
            except subprocess.CalledProcessError as e:
                logger.error(f"Failed to clone bolt.diy repository: {e}")
                raise RuntimeError(f"Failed to clone bolt.diy repository: {e}")
        
        # Build the frontend
        logger.info("Building bolt.diy frontend...")
        try:
            # Change to the bolt.diy directory
            cwd = os.getcwd()
            os.chdir(cls.BOLT_DIY_DIR)
            
            # Install dependencies and build
            subprocess.run(["npm", "install"], check=True)
            subprocess.run(["npm", "run", "build"], check=True)
            
            # Change back to the original directory
            os.chdir(cwd)
            
            logger.info("bolt.diy frontend built successfully.")
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to build bolt.diy frontend: {e}")
            raise RuntimeError(f"Failed to build bolt.diy frontend: {e}")