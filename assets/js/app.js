// Carregar Google Charts
google.charts.load('current', {'packages':['gauge']});
google.charts.setOnLoadCallback(initializeGauges);

let client;
let lastUpdate = new Date();

function initializeGauges() {
    drawGauge('temperatureGauge', 0);
    drawGauge('humidityGauge', 0);
    MQTTConnect();
}

function drawGauge(elementId, value) {
    const data = google.visualization.arrayToDataTable([
        ['Label', 'Value'],
        ['Value', value]
    ]);

    const options = {
        min: 0,
        max: 100,
        greenFrom: 70,
        greenTo: 100,
        yellowFrom:50,
        yellowTo: 70,
        redFrom:0,
        redTo: 50,
        minorTicks: 5
    };

    const gauge = new google.visualization.Gauge(document.getElementById(elementId));
    gauge.draw(data, options);
}

function MQTTConnect() {
    client = new Paho.MQTT.Client("test.mosquitto.org", Number(8080), "clientId-" + Math.random());
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;

    client.connect({onSuccess: onConnect, onFailure: onError});
}

function onConnect() {
    document.getElementById("status").innerHTML = "Conectado";
    document.getElementById("status").className = "alert alert-success";
    client.subscribe("temperature");
    client.subscribe("humidity");
}

function onMessageArrived(message) {
    const topic = message.destinationName;
    const payload = message.payloadString;

    let value;
    if (topic === "temperature") {
        value = parseValue(payload, "Temperature");
        if (value !== null) {
            document.getElementById("temperatureValue").innerText = `Valor: ${value} °C`;
            drawGauge('temperatureGauge', value);
        }
    } else if (topic === "humidity") {
        value = parseValue(payload, "Humidity");
        if (value !== null) {
            document.getElementById("humidityValue").innerText = `Valor: ${value} %`;
            drawGauge('humidityGauge', value);
        }
    }
    lastUpdate = new Date();
}

function parseValue(payload, type) {
    const regex = new RegExp(`${type}: (\\d+(?:\\.\\d+)?)`);
    const match = payload.match(regex);
    if (match) {
        return parseFloat(match[1]);
    } else {
        document.getElementById("status").innerHTML = `Erro ao processar ${type}`;
        document.getElementById("status").className = "alert alert-danger";
        return null;
    }
}

function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        document.getElementById("status").innerHTML = "Falha na conexão";
        document.getElementById("status").className = "alert alert-danger";
        setTimeout(MQTTConnect, 5000); // Tentar reconectar após 5 segundos
    }
}

function onError() {
    document.getElementById("status").innerHTML = "Erro ao conectar";
    document.getElementById("status").className = "alert alert-danger";
}