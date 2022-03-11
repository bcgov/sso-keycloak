There are currently four sysdig teams with alerts that need to be backed up.  This needs to be done with different login tokens because unlike Dashboards, sysdig alerts are associated with a team and **not** with a user.

The teams are:

```
prod
prod_pvc
sandbox
sandbox_pvc
```

## Backup alerts

To backup the alerts for a given sysdig team:

```
python scripts/backup_alerts.py <TEAM>
```

The backups are stored in the `backup` folder.

## Restore Alerts

```
python scripts/restore_alerts.py <TEAM>
```

Note, if you attempt to restore the alert twice an error  `status code 409` will get produced, blocking the script.  If this happens you may need to manually restore individual alerts.
