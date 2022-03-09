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
python scripts/update_alerts.py <TEAM>
```
