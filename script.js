function checkIn() {
    const phoneNumber = document.getElementById("phoneNumber").value.trim();
    const phoneError = document.getElementById("phoneError");
    const phoneInput = document.getElementById("phoneNumber");
    const checkInButton = document.querySelector("button");

    // Reset error state
    phoneError.style.display = "none";
    phoneInput.classList.remove("input-error");

    // Validate phone number
    if (!phoneNumber || phoneNumber.length < 10 || phoneNumber.length > 15) {
        phoneError.textContent = "Wrong Phone Number Format"; // Set error message
        phoneError.style.display = "block"; // Show error message
        phoneInput.classList.add("input-error"); // Add red border
        return; // Stop further execution
    }

    // Check if the user has already checked in within the last 24 hours
    const storedTime = localStorage.getItem(phoneNumber);
    if (storedTime) {
        const timeDifference = Date.now() - storedTime;

        // If less than 24 hours have passed, prevent check-in
        if (timeDifference < 24 * 60 * 60 * 1000) {
            phoneError.textContent = "You have already checked in."; // Set error message
            phoneError.style.display = "block"; // Show error message
            return; // Stop further execution
        } else {
            // If more than 24 hours have passed, clear the old entry
            localStorage.removeItem(phoneNumber);
        }
    }

    // Disable the button and change its text
    checkInButton.disabled = true;
    checkInButton.textContent = "Checking...";

    // Proceed with check-in
    document.getElementById("loading").style.display = "flex";
    startLogoAnimation(); // Show loading screen

    fetch("https://script.google.com/macros/s/AKfycbwZlzbP9RHtw99ZtVD2eM6OsllXKa9GQUmme9aYnU-TRIcWDH72KADyEQBfUz5RxIQy/exec?phone=" + encodeURIComponent(phoneNumber), { cache: "no-store" })
        .then(response => response.json())
        .then(data => {
            document.getElementById("loading").style.display = "none";
            stopLogoAnimation(); // Hide loading screen

            if (data.success) {
                document.getElementById("message").innerHTML = `Shalom <span>${data.name}</span> </br> We're happy to see you!`;
                document.getElementById("phoneNumber").value = ""; // Clear the input field

                // Save the phone number and current timestamp in localStorage
                localStorage.setItem(phoneNumber, Date.now()); // Store the current time
            } else {
                document.getElementById("message").innerHTML = `Nomor HP belum terdaftar, registrasi dulu di <br> 
                <a href="register.html?phone=${encodeURIComponent(phoneNumber)}" style="color: #ff9800; font-weight: bold; text-decoration: none;">Halaman Registrasi</a>`;
            }
            document.getElementById("popup").style.display = "flex";

            // Re-enable the button after the API call is complete
            checkInButton.disabled = false;
            checkInButton.textContent = "Check In";
        })
        .catch(error => {
            document.getElementById("loading").style.display = "none";
            stopLogoAnimation();

            // Re-enable the button if there's an error
            checkInButton.disabled = false;
            checkInButton.textContent = "Check In";

            alert("Error fetching data. Please try again.");
            console.error("Error:", error);
        });
}

function validatePhoneNumber(input) {
    const phoneError = document.getElementById("phoneError");
    const phoneNumber = input.value.replace(/\D/g, ''); // Remove non-digits

    // Check if the phone number is valid (e.g., at least 10 digits)
    if (phoneNumber.length < 10 || phoneNumber.length > 15) {
        input.style.borderColor = "red"; // Change border color to red
        phoneError.textContent = "Wrong Phone Number Format"; // Show error message
        phoneError.style.display = "block"; // Display the error message
    } else {
        input.style.borderColor = "#ccc"; // Reset border color
        phoneError.style.display = "none"; // Hide the error message
    }

    input.value = phoneNumber; // Update the input value with only digits
}

function closePopup() {
    document.getElementById("popup").style.display = "none";
}


// Function to start logo animation
function startLogoAnimation() {
    const logo = document.querySelector(".loading-logo");
    logo.style.animation = "glow 1.5s ease-in-out infinite, fadeIn 1.5s ease-in-out";
}

// Function to stop logo animation
function stopLogoAnimation() {
    const logo = document.querySelector(".loading-logo");
    logo.style.animation = "none"; // Stop animation when loading is done
}
