# Utility Scripts

## kc-logs.sh

### Pre-requisites

- [oc](https://docs.openshift.com/container-platform/4.13/cli_reference/openshift_cli/getting-started-cli.html) client
- [jq](https://stedolan.github.io/jq/download/) - JSON processor
- Microsoft Excel

### Steps

- Login to the openshift cluster and select the namespace using `oc project <LICENSE_PLATE>`
- Run `./kc-logs.sh` to generate a csv that contains all the previous day logs
- Open csv file and under `Data` tab, use `Text to Columns` with delimiter `|` to spread out the logs into different columns
- Select entire data and use `Sort A to Z` option Under `Data` tab to sort the data by timestamp
- After sorting, add a header at the first row of the worksheet
- To perform further analysis, it is recommended to save the worksheet in `.xlsx` format and discard the csv file
- `=DATEVALUE(LEFT(A3,10)) +TIMEVALUE(MID(A3,12,8))` is the formula to convert the timestamp. After conversion, format the cells to a custom format
- If you just need a string value of date and time then ignore above formula and use `=CONCATENATE(LEFT(A2, 10)," ",MID(A2,12,2))`
- Under `Insert` tab, use `Pivot Table` to generate grouped data
