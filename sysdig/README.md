# Sysdig API config

## Install requirements for the SDCClient

This documentation follows the [Sysdig developer documentation](https://docs.sysdig.com/en/docs/developer-tools/)

The python scripts are pulled from the sysdig [Github Repo](https://github.com/sysdiglabs/sysdig-sdk-python/tree/master/examples).

### Create a virtual env for the python packages (optional but recomended)

To create a venv run the command:

`python3 -m venv env`

and activate it (in mac or linux) using:

`source env/bin/activate`

 The environment is deactivated by running `deactivate`.

### Install the requirements

 `pip install -r requirements.txt`


### Retrieve the sysdig API token

This can be found in your sysdig `User Profile` in the online app.

### Create your `.env` file

Make a copy of the `.env.example` file, and name it `.env`.  Retrieve the neccessary api tokens from the Sysdig app. You will need one for each project.  The "Sysdig API Token" will be different depending on which project you have active in the web app.
