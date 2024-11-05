// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-analytics.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCPuVpIRl6CA0TXHBZ8UJ9pra6JXVBIsvA",
    authDomain: "pagamento-carro.firebaseapp.com",
    projectId: "pagamento-carro",
    storageBucket: "pagamento-carro.appspot.com",
    messagingSenderId: "307108744491",
    appId: "1:307108744491:web:452b76f74f0e871316496e",
    measurementId: "G-N6E2DH37H1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);  // Inicializa o Firestore

// Usuários de exemplo
const users = {
    admin: { password: "admin", role: "admin" },
    fakedoi: { password: "fakedoi", role: "viewer" }
};

let currentUser = null;
const VALOR_DEVIDO = 25000;  // Valor total devido

// Funções globais
window.login = function() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (users[username] && users[username].password === password) {
        currentUser = users[username];
        document.getElementById("login-section").style.display = "none";
        document.getElementById("app-section").style.display = "block";

        if (currentUser.role === "admin") {
            document.getElementById("admin-section").style.display = "block";
        }
        atualizarHistorico();
    } else {
        alert("Usuário ou senha incorretos.");
    }
}

window.logout = function() {
    currentUser = null;
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    document.getElementById("login-section").style.display = "block";
    document.getElementById("app-section").style.display = "none";
}

window.adicionarTransferencia = async function() {
    if (currentUser && currentUser.role === "admin") {
        const data = document.getElementById("data-transferencia").value;
        const valor = parseFloat(document.getElementById("valor-transferencia").value);

        if (!data || isNaN(valor)) {
            alert("Preencha todos os campos corretamente.");
            return;
        }

        // Adiciona ao Firestore
        const novaTransf = { data, valor };
        const transferenciasRef = collection(db, 'transferencias');
        await addDoc(transferenciasRef, novaTransf);

        document.getElementById("data-transferencia").value = "";
        document.getElementById("valor-transferencia").value = "";
    }
}

function atualizarHistorico() {
    const historicoEl = document.getElementById("historico");
    let totalPago = 0;

    // Ouve mudanças no Firestore e atualiza a lista
    const transferenciasRef = collection(db, 'transferencias');
    onSnapshot(transferenciasRef, (snapshot) => {
        historicoEl.innerHTML = "";
        const transferencias = [];

        snapshot.forEach((doc) => {
            const transf = doc.data();
            transferencias.push(transf); // Adiciona transferências a um array
            totalPago += transf.valor; // Acumula o total pago
        });

        // Ordena transferências por data
        transferencias.sort((a, b) => {
            const [dayA, monthA, yearA] = a.data.split('/').map(Number);
            const [dayB, monthB, yearB] = b.data.split('/').map(Number);
            return new Date(yearA, monthA - 1, dayA) - new Date(yearB, monthB - 1, dayB);
        });

        // Atualiza a lista ordenada
        transferencias.forEach(transf => {
            const li = document.createElement("li");
            li.classList.add("list-group-item");
            li.textContent = `${transf.data}: R$ ${transf.valor.toFixed(2)}`;
            historicoEl.appendChild(li);
        });

        // Atualiza os totais exibidos
        document.getElementById("total-pago").textContent = totalPago.toFixed(2);
        document.getElementById("valor-restante").textContent = (VALOR_DEVIDO - totalPago).toFixed(2);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    if (currentUser) {
        atualizarHistorico();
    }
});