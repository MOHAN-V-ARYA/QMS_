package os.deliveryquality;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.io.ByteArrayInputStream;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.zip.ZipInputStream;

import static org.junit.jupiter.api.Assertions.*;

class QmsServerTest {
    private static final Path DB = Path.of("target", "qms-api-test.db");
    private QmsServer server;
    private HttpClient client;

    @BeforeEach void startServer() throws Exception {
        Files.createDirectories(DB.getParent());
        Files.deleteIfExists(DB);
        Files.deleteIfExists(Path.of(DB + "-wal"));
        Files.deleteIfExists(Path.of(DB + "-shm"));
        server = new QmsServer(0, "jdbc:sqlite:" + DB.toAbsolutePath(), Path.of("src/main/resources/web"));
        server.start();
        client = HttpClient.newHttpClient();
    }

    @AfterEach void stopServer() throws Exception {
        if (server != null) server.stop(0);
        Files.deleteIfExists(DB);
        Files.deleteIfExists(Path.of(DB + "-wal"));
        Files.deleteIfExists(Path.of(DB + "-shm"));
    }

    @Test void seedsDomainRecordsAndServesWorkingDocumentDownloads() throws Exception {
        HttpResponse<String> requirements = get("/api/requirements");
        assertEquals(200, requirements.statusCode());
        assertTrue(requirements.body().contains("REQ-001"));
        assertTrue(requirements.body().contains("REQ-008"));
        assertTrue(requirements.body().contains("Mohan V (Software Engineer I)"));
        assertTrue(requirements.body().contains("Nruthya (Software Engineer II)"));
        assertTrue(requirements.body().contains("Sinchana (Software Engineer III)"));
        assertEquals(200, get("/docs/project-quality-plan.md").statusCode());
        assertTrue(get("/docs/project-quality-plan.md").body().contains("quality objectives"));
        assertEquals(200, get("/api/health").statusCode());
    }

    @Test void rotatesDisplayedDeveloperOnEachRestartWithoutRepeatingPreviousName() throws Exception {
        ObjectMapper mapper=new ObjectMapper();
        JsonNode firstProfile=mapper.readTree(get("/api/dashboard").body()).path("currentUser");
        assertFalse(firstProfile.isMissingNode());
        assertFalse(firstProfile.path("initials").asText().isBlank());
        assertFalse(firstProfile.path("title").asText().isBlank());
        String first=firstProfile.path("name").asText();
        server.stop(0);

        server=new QmsServer(0,"jdbc:sqlite:"+DB.toAbsolutePath(),Path.of("src/main/resources/web"));
        server.start();
        String second=mapper.readTree(get("/api/dashboard").body()).path("currentUser").path("name").asText();
        assertNotEquals(first,second);
        server.stop(0);

        server=new QmsServer(0,"jdbc:sqlite:"+DB.toAbsolutePath(),Path.of("src/main/resources/web"));
        server.start();
        String third=mapper.readTree(get("/api/dashboard").body()).path("currentUser").path("name").asText();
        assertNotEquals(second,third);
        assertTrue(List.of("Mohan V","Nruthya","Sinchana").containsAll(List.of(first,second,third)));
    }

    @Test void downloadsAllControlledDocumentsAsWordAndExcelFiles() throws Exception {
        String[] documents={"project-quality-plan","requirements-development-management-procedure","requirements-review-checklist",
            "change-request-form","requirements-traceability-matrix","review-procedure","release-readiness-checklist","capa-procedure"};
        for(String document:documents) {
            HttpResponse<byte[]> word=getBytes("/docs/"+document+".docx");
            assertEquals(200,word.statusCode(),document+" Word download");
            assertTrue(word.headers().firstValue("Content-Type").orElse("").contains("wordprocessingml.document"));
            Set<String> wordEntries=zipEntries(word.body());
            assertTrue(wordEntries.contains("word/document.xml"));
            assertTrue(wordEntries.contains("word/styles.xml"));

            HttpResponse<byte[]> excel=getBytes("/docs/"+document+".xlsx");
            assertEquals(200,excel.statusCode(),document+" Excel download");
            assertTrue(excel.headers().firstValue("Content-Type").orElse("").contains("spreadsheetml.sheet"));
            Set<String> excelEntries=zipEntries(excel.body());
            assertTrue(excelEntries.contains("xl/workbook.xml"));
            assertTrue(excelEntries.contains("xl/worksheets/sheet1.xml"));
        }
        assertEquals(404,getBytes("/docs/missing-document.docx").statusCode());
    }

    @Test void supportsRequirementCreateUpdateDeleteAndValidation() throws Exception {
        HttpResponse<String> missingTitle = send("POST","/api/requirements","{\"code\":\"REQ-090\"}");
        assertEquals(400,missingTitle.statusCode());
        HttpResponse<String> created = send("POST","/api/requirements","{\"code\":\"REQ-090\",\"title\":\"New retry guard\",\"description\":\"Retries are idempotent\",\"owner\":\"QA\",\"status\":\"Draft\",\"risk\":\"Medium\",\"category\":\"Reliability\"}");
        assertEquals(201,created.statusCode());
        String id=created.body().replaceAll(".*\"id\":(\\d+).*","$1");
        HttpResponse<String> updated=send("PATCH","/api/requirements/"+id,"{\"status\":\"Approved\",\"test_ref\":\"TC-990\"}");
        assertEquals(200,updated.statusCode());
        assertTrue(updated.body().contains("\"status\":\"Approved\""));
        assertEquals(200,send("DELETE","/api/requirements/"+id,"").statusCode());
        assertEquals(404,send("PATCH","/api/requirements/"+id,"{\"status\":\"Draft\"}").statusCode());
    }

    @Test void calculatesDashboardReportAndReleaseGate() throws Exception {
        assertEquals(200,get("/api/dashboard").statusCode());
        HttpResponse<String> report=get("/api/report");
        assertTrue(report.body().contains("\"coverage\""));
        assertTrue(report.body().contains("Illustrative demo estimate; review iteration history is not persisted"));
        assertTrue(report.body().contains("Illustrative demo estimate; change impact and retest history are not persisted"));
        assertTrue(report.body().contains("\"medianOpenDefectAgeDays\""));
        HttpResponse<String> gate=get("/api/release");
        assertEquals(200,gate.statusCode());
        assertTrue(gate.body().contains("\"ready\":false"));
        assertTrue(gate.body().contains("\"detail\":\"8 / 8 requirements linked to design and tests\""));
        assertEquals(200,send("PATCH","/api/release","{\"approved_by\":\"Customer delegate\",\"rollback_ready\":true,\"monitoring_ready\":true}").statusCode());
        assertTrue(get("/api/release").body().contains("Customer delegate"));
    }

    @Test void capaCannotCloseWithoutEffectivenessEvidence() throws Exception {
        HttpResponse<String> blocked=send("PATCH","/api/capas/3","{\"status\":\"Closed\"}");
        assertEquals(400,blocked.statusCode());
        HttpResponse<String> closed=send("PATCH","/api/capas/3","{\"status\":\"Closed\",\"effectiveness\":\"Independent retest passed; no recurrence in regression cycle 04\"}");
        assertEquals(200,closed.statusCode());
        assertTrue(closed.body().contains("\"status\":\"Closed\""));
    }

    private HttpResponse<String> get(String path)throws Exception{return send("GET",path,"");}
    private HttpResponse<byte[]> getBytes(String path)throws Exception {
        return client.send(HttpRequest.newBuilder(URI.create("http://localhost:"+server.port()+path)).GET().build(),HttpResponse.BodyHandlers.ofByteArray());
    }
    private static Set<String> zipEntries(byte[] archive)throws Exception {
        Set<String> entries=new HashSet<>();
        try(ZipInputStream zip=new ZipInputStream(new ByteArrayInputStream(archive))) {
            for(var entry=zip.getNextEntry();entry!=null;entry=zip.getNextEntry())entries.add(entry.getName());
        }
        return entries;
    }
    private HttpResponse<String> send(String method,String path,String body)throws Exception {
        HttpRequest.Builder request=HttpRequest.newBuilder(URI.create("http://localhost:"+server.port()+path));
        if(method.equals("GET"))request.GET();
        else request.header("Content-Type","application/json").method(method,HttpRequest.BodyPublishers.ofString(body));
        return client.send(request.build(),HttpResponse.BodyHandlers.ofString());
    }
}
