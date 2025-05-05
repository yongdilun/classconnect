package main

import "github.com/gin-gonic/gin"

func main() {
    r := gin.Default()

    // Route: GET /
    r.GET("/", func(c *gin.Context) {
        c.JSON(200, gin.H{
            "message": "Welcome to ClassConnect!",
        })
    })

    // Start server at localhost:8080
    r.Run()
}
