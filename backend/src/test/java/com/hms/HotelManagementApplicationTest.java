package com.hms;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT)
class HotelManagementApplicationTest {
  @LocalServerPort int port;
  @Autowired TestRestTemplate http;
  @Test void healthEndpointIsAvailable(){
    ResponseEntity<String> response=http.getForEntity("http://localhost:"+port+"/api/v1/health",String.class);
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).contains("UP");
  }
  @Test void roomsEndpointReturnsAList(){
    ResponseEntity<String> response=http.getForEntity("http://localhost:"+port+"/api/v1/rooms",String.class);
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isEqualTo("[]");
  }
}
