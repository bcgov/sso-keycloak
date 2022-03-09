This will allow us to backup and restore the statefulsets in the 6 silver namespaces.

##Backup process:

There are six silver namepaces with stateful sets that must be backed up manually:

 - 3d5c3f-dev - SandDev
 - 3d5c3f-test - SandTest
 - 3d5c3f-prod - SandProd
 - 6d70e7-dev - ProductionDev
 - 6d70e7-test - ProductionTest
 - 6d70e7-prod - ProductionProd

To back up this configuration, pull them down, convert them to yaml.

```
 oc -n <<Namspace>> get statefulset -o yaml > .backups/statefulset<<Name>>.yaml
```

Remove the folling content from the YAML:

- creationTimestamp:
- resourceVersion:
- selfLink:
- uid:

This will cause errors if we attempt to restore the statefull set with them in it.


To restore these, run

```
oc -n <<Namespace>> apply -f .backups/statefulset<<Name>>.yaml
```
