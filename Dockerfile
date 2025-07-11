FROM eclipse-temurin:21-jdk

WORKDIR /app

COPY back-end/target/*.jar app.jar

COPY back-end/src/main/resources/static/ /app/static/

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
