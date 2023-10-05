// Add an event listener
const container = document.getElementById('chart');

const time = new Date();
const gridColor = '#AAA'

const data = [{
    x: [],
    y: [],
    mode: 'lines',
    name: 'CPU Percent Used',
    line: { color: '#80CAF6' }
}, {
    x: [],
    y: [],
    mode: 'lines',
    name: 'Memory Percent Used',
    line: { color: '#DF56F1' }
}]

Plotly.newPlot(container, data, {
    title: 'Keycloak Memory and CPU usage over Time',
    paper_bgcolor: '#303030',
    plot_bgcolor: '#303030',
    font: {
        color: 'white'
    },
    yaxis: {
        gridcolor: gridColor,
        title: 'Percent Used',
    },
    xaxis: {
        gridcolor: gridColor,
        title: 'Time',
    }
});


document.addEventListener("podmanData", function (e) {

    const time = new Date();

    const update = {
        x: [[time], [time]],
        y: [[e.detail.cpuPercent], [e.detail.memoryPercent]]
    }

    const olderTime = time.setMinutes(time.getMinutes() - 3);
    const futureTime = time.setMinutes(time.getMinutes() + 3);

    const minuteView = {
        xaxis: {
            type: 'date',
            range: [olderTime, futureTime],
            gridcolor: gridColor,
            title: 'Time',
        }
    };

    Plotly.relayout(container, minuteView);
    Plotly.extendTraces(container, update, [0, 1])
});
