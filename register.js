document.addEventListener('DOMContentLoaded', () => {
    // Check if phone number was passed in URL query
    const urlParams = new URLSearchParams(window.location.search);
    const phoneParam = urlParams.get('phone');
    if (phoneParam) {
        document.getElementById('noHp').value = phoneParam;
    }
});

document.getElementById("registerForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    document.getElementById("loading").style.display = "flex";
    startLogoAnimation();

    const formData = {
        namaLengkap: document.getElementById("namaLengkap").value.trim(),
        namaPanggilan: document.getElementById("namaPanggilan").value.trim(),
        jenisKelamin: document.getElementById("jenisKelamin").value,
        domisili: document.getElementById("domisili").value.trim(),
        paroki: document.getElementById("paroki").value.trim(),
        noHp: document.getElementById("noHp").value.trim(),
        tanggalLahir: document.getElementById("tanggalLahir").value,
        statusKeanggotaan: document.getElementById("statusKeanggotaan").value
    };

    // Replace with the actual Google Apps Script Web App URL
    const scriptUrl = "https://script.google.com/macros/s/AKfycbwZlzbP9RHtw99ZtVD2eM6OsllXKa9GQUmme9aYnU-TRIcWDH72KADyEQBfUz5RxIQy/exec";

    fetch(scriptUrl, {
        method: "POST",
        // Using text/plain prevents CORS preflight issues for simple POSTs
        headers: {
            "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({ action: "register", data: formData })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("loading").style.display = "none";
        stopLogoAnimation();
        
        if (data.success) {
            document.getElementById("message").innerHTML = `Registrasi Berhasil! <br> Silakan kembali dan check-in.`;
            document.getElementById("registerForm").reset();
            
            // Allow them to go back to checkin easily
            const btn = document.querySelector(".popup-content button");
            btn.onclick = function() {
                window.location.href = "index.html";
            };
        } else {
            document.getElementById("message").innerHTML = `Error: ${data.error || "Gagal menyimpan data. Coba lagi."}`;
        }
        
        document.getElementById("popup").style.display = "flex";
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Registration";
    })
    .catch(error => {
        document.getElementById("loading").style.display = "none";
        stopLogoAnimation();
        
        document.getElementById("message").innerHTML = "Error koneksi ke server. Silakan coba lagi.";
        document.getElementById("popup").style.display = "flex";
        
        console.error("Error:", error);
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Registration";
    });
});

function closePopup() {
    document.getElementById("popup").style.display = "none";
}

function startLogoAnimation() {
    const logo = document.querySelector(".loading-logo");
    if(logo) {
        logo.style.animation = "glow 1.5s ease-in-out infinite, fadeIn 1.5s ease-in-out";
    }
}

function stopLogoAnimation() {
    const logo = document.querySelector(".loading-logo");
    if(logo) {
        logo.style.animation = "none";
    }
}
