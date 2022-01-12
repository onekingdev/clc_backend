export const template = (createdUsersCount, loginedUsers, from, to, dailyPassword) => {
    const today = new Date();
    const title = `This is the CLC(${process.env.GCLOUD_PROJECT}) Report on ${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
    const date = `( ${from} ~ ${to} )`;
    const brief = `Today ${createdUsersCount} new users were registered and ${loginedUsers.length} users logined at the site.`
    
    let tableContent = '';
    for(let loginedUser of loginedUsers) {
        tableContent += `
            <tr>
                <td>${loginedUser['users_email']}</td>
                <td>${loginedUser['users_createdAt']}</td>
                <td>${loginedUser['users_lastLoginAt']}</td>
                <td>${loginedUser['users_correctQuestions']}</td>
                <td>${loginedUser['users_wrongQuestions']}</td>
            </tr>
        `;
    }
    const table = `
    <table id="customers">
        <tr>
            <th>User Name</th>
            <th>Create Time</th>
            <th>Login Time</th>
            <th>Correct Answered Questions</th>
            <th>Wrong Answered Questions</th>
        </tr>
       ${tableContent}
    </table>`;

    return `
    <html>
        <head>
        <style>
        #customers {
            font-family: Arial, Helvetica, sans-serif;
            border-collapse: collapse;
            width: 100%;
        }
        
        #customers td, #customers th {
            border: 1px solid #ddd;
            padding: 8px;
        }
        
        #customers tr:nth-child(even){background-color: #f2f2f2;}
        
        #customers tr:hover {background-color: #ddd;}
        
        #customers th {
            padding-top: 12px;
            padding-bottom: 12px;
            text-align: left;
            background-color: #0e0f0f;
            color: white;
        }
        </style>
        </head>
        <body>
        
        <p><center>${title}<center></p>
        <p><center>${date}<center></p>
        <p><center>${brief}<center></p>
        ${table}
        <p><center>Password : ${dailyPassword}<center></p>

        </body>
        </html>
    `    
}