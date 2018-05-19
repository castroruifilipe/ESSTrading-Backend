db.createUser({
    user: "ess",
    pwd: "12345",
    roles: [
        { role: "readWrite", db: "quotes" }
    ]
})