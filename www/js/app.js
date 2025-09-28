document.addEventListener("deviceready", function () {
  console.log("Cordova pronto");
});

// Funções de teste do Bluetooth
function verificarBluetooth() {
  bluetoothSerial.isEnabled(
    function() {
      alert("Bluetooth está ativado");
    },
    function() {
      alert("Bluetooth está desativado. Por favor, ative o Bluetooth.");
    }
  );
}

function listarDispositivos() {
  bluetoothSerial.list(
    function(devices) {
      console.log(devices);
      const select = document.getElementById('dispositivos');
      select.style.display = 'block';
      
      // Limpa opções anteriores
      while(select.options.length > 1) {
        select.remove(1);
      }

      // Adiciona dispositivos encontrados
      devices.forEach(function(device) {
        const option = document.createElement('option');
        option.value = device.address;
        option.text = device.name;
        select.add(option);
      });
    },
    function(error) {
      alert('Erro ao listar dispositivos: ' + error);
    }
  );
}

function conectarDispositivo() {
  const select = document.getElementById('dispositivos');
  const endereco = select.value;
  
  if (!endereco) {
    alert('Por favor, selecione um dispositivo');
    return;
  }

  bluetoothSerial.connect(
    endereco,
    function() {
      alert('Conectado com sucesso!');
    },
    function() {
      alert('Erro ao conectar. Tente novamente.');
    }
  );
}

function imprimirTeste() {
  const textoTeste = 
    "=== TESTE DE IMPRESSÃO ===\n" +
    "Comandas Delivery\n" +
    "Data: " + new Date().toLocaleDateString() + "\n" +
    "Hora: " + new Date().toLocaleTimeString() + "\n" +
    "========================\n\n";

  bluetoothSerial.write(
    textoTeste,
    function() {
      alert('Teste impresso com sucesso!');
    },
    function(err) {
      alert('Erro ao imprimir teste: ' + err);
    }
  );
}

function imprimir() {
  const cliente = document.getElementById('cliente').value;
  const itens = document.getElementById('itens').value;
  const obs = document.getElementById('obs').value;

  const textoComanda =
    "---- COMANDA ----\n" +
    "Cliente: " + cliente + "\n" +
    "Itens:\n" + itens + "\n" +
    "Obs: " + obs + "\n" +
    "------------------\n\n";

  bluetoothSerial.write(
    textoComanda,
    function() {
      alert("Comanda enviada para a impressora!");
    },
    function(err) {
      alert("Erro ao imprimir: " + err);
    }
  );
}
