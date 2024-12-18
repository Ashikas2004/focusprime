document.addEventListener("DOMContentLoaded", () => {
  const userProfileContainer = document.getElementById("profile");
  const taskHistoryList = document.getElementById("taskHistory");

  // Retrieve logged-in user data from localStorage
  const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));

  if (!loggedInUser) {
    alert('No user is logged in. Redirecting to login page.');
    window.location.href = 'login.html'; // Redirect to login page if no user data is found
    return;
  }

  // Function to fetch tasks and calculate reward points
  async function fetchRewardPointsAndTasks() {
    try {
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem("authToken")}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.statusText}`);
      }

      const tasks = await response.json();

      // Calculate reward points
      const completedTasksCount = tasks.filter(task => task.completed === true).length;
      const rewardPoints = completedTasksCount * 10;

      // Update user profile with reward points
      userProfileContainer.innerHTML += `
        <p><strong>Reward Points&emsp;&emsp;:</strong> ${rewardPoints}</p>
      `;

      // Display task history
      tasks.forEach(task => {
        const listItem = document.createElement('li');
        listItem.textContent = `Task: ${task.text || 'Unknown'},  
        Status: ${task.completed || 'false'}, Date: ${new Date(task.createdAt).toLocaleString()}`;
        taskHistoryList.appendChild(listItem);
      });
    } catch (error) {
      console.error('Error fetching tasks or calculating rewards:', error);
    }
  }

  // Display user profile information
  userProfileContainer.innerHTML = `
    <p><strong>Username&emsp;&emsp;&emsp;&emsp;:</strong> ${loggedInUser.username}</p>
    <p><strong>ID &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&emsp; &emsp; &emsp;&emsp;:</strong> ${loggedInUser._id}</p>
    <p><strong>Email&emsp; &emsp; &emsp; &emsp;&emsp;:</strong> <span id="email-display">${loggedInUser.email}</span></p>
    <p><strong>Account Created&emsp;:</strong> ${new Date(loggedInUser.created_at).toLocaleString()}</p>
    <button id="change-password-btn">Change Password</button>
  `;

  // Fetch reward points and task history
  fetchRewardPointsAndTasks();

  // Event listener for changing password
  document.getElementById('change-password-btn').addEventListener('click', async () => {
    const oldPassword = prompt("Enter your old password:");

    if (!oldPassword) {
      alert("Old password is required.");
      return;
    }

    const isOldPasswordCorrect = await verifyOldPassword(oldPassword);
    if (!isOldPasswordCorrect) {
      alert("Old password is incorrect.");
      return;
    }

    const newPassword = prompt("Enter your new password:");
    const confirmNewPassword = prompt("Re-enter your new password:");

    if (newPassword !== confirmNewPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (newPassword === oldPassword) {
      alert("New password cannot be the same as the old password.");
      return;
    }

    // Update password in the backend
    try {
      await updatePassword(newPassword);
      alert('Password updated successfully!');
    } catch (error) {
      alert('Error updating password: ' + error.message);
    }
  });

  // Verify old password with the backend
  async function verifyOldPassword(oldPassword) {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${loggedInUser._id}/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem("authToken")}`
        },
        body: JSON.stringify({ oldPassword }),
      });

      const result = await response.json();
      return response.ok;
    } catch (error) {
      console.error("Error verifying old password:", error);
      return false;
    }
  }

  // Update password in the backend
  async function updatePassword(newPassword) {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${loggedInUser._id}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem("authToken")}`
        },
        body: JSON.stringify({ newPassword }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update password: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }
});
