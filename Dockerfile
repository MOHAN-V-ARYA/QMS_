FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -q package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/delivery-quality-os-1.0.0.jar ./app.jar
COPY --from=build /app/src/main/resources/web ./src/main/resources/web
ENV QMS_DB=data/qms.db
EXPOSE 8080
CMD ["sh", "-c", "java -jar app.jar"]
