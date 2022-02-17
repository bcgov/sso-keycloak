# Sysdig API config

## Install requirements for the SDCClient

This documentation follows the [Sysdig developer documentation](https://docs.sysdig.com/en/docs/developer-tools/)

The python scripts are pulled from the sysdig [Github Repo](https://github.com/sysdiglabs/sysdig-sdk-python/tree/master/examples).

### Create a virtual env for the python packages (optional but recomended)

To create a venv run the command:

`python -m venv env`

and activate it (in mac or linux) using:

`source env/bin/activate`

 The environment is deactivated by running `deactivate`.

### Install the requirements

 `pip install -r requirements.txt`


### Retrieve the sysdig API token

This can be found in your sysdig `User Profile` in the online app.

## Backup the dashboards

### Download the the existing dashboards

The dashboards can be backed up py running the `downloan_dashboards` script:

```
python download_dashboards.py API_TOKEN SAVED_DASHBOARDS.ZIP
```

### Extract the zipped dashboards

The download script pulls down a zipped folder of dashboards on the user's account.  To edit them manually they must be unzipped.

### Delete the extra dashboards

The download script will pull in all dashboards associated with the account used to pull them down. For the moment these will need to be manualy deleted.

## Restore the dashboards

### Zip the dashboards

The script that restores the dashboards expects a zipped folder as input.  The software used to zip the files will be os dependant.  For linux the follwing comand will work:

```
zip -r SAVED_DASHBOARDS.zip sysdig-dashboard-dir
```


### Restore the dashboards

The command to restore the dashboards to the sysdig instance is:


```
python restore_dashboards.py API_TOKEN SAVED_DASHBOARDS.zip
```

### Clean up

This will recreate all dashboards in the web client.  These are owned by the user that ran the scripts. These will need to be shared with the teams `6d70e7-team` or `6d70e7-team-persistent-storage`.
