package com.example.time_manager.controllers;

import com.example.time_manager.dto.leave.LeaveTypeCreateInput;
import com.example.time_manager.dto.leave.LeaveTypeUpdateInput;
import com.example.time_manager.graphql.controller.LeaveTypeController;
import com.example.time_manager.model.leave.LeaveType;
import com.example.time_manager.service.leave.LeaveTypeService;
import org.junit.jupiter.api.*;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class LeaveTypeControllerTest {

    @Mock
    private LeaveTypeService service;

    private LeaveTypeController controller;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        controller = new LeaveTypeController(service);
    }

    @Test
    void testLeaveTypes_ReturnsList() {
        List<LeaveType> mockList = List.of(new LeaveType(), new LeaveType());
        when(service.listAll()).thenReturn(mockList);

        List<LeaveType> result = controller.leaveTypes();

        assertEquals(2, result.size());
        verify(service).listAll();
    }

    @Test
    void testLeaveType_ReturnsByCode() {
        LeaveType mockType = new LeaveType();
        mockType.setCode("CP");
        mockType.setLabel("Congés Payés");

        when(service.getByCode("CP")).thenReturn(mockType);

        LeaveType result = controller.leaveType("CP");

        assertNotNull(result);
        assertEquals("CP", result.getCode());
        assertEquals("Congés Payés", result.getLabel());
        verify(service).getByCode("CP");
    }

    @Test
    void testCreateLeaveType_Success() {
        LeaveTypeCreateInput input = new LeaveTypeCreateInput();
        input.setCode("RTT");
        input.setLabel("Réduction du Temps de Travail");

        LeaveType created = new LeaveType();
        created.setCode("RTT");
        created.setLabel("Réduction du Temps de Travail");

        when(service.create("RTT", "Réduction du Temps de Travail")).thenReturn(created);

        LeaveType result = controller.createLeaveType(input);

        assertEquals("RTT", result.getCode());
        assertEquals("Réduction du Temps de Travail", result.getLabel());
        verify(service).create("RTT", "Réduction du Temps de Travail");
    }

    @Test
    void testUpdateLeaveType_Success() {
        LeaveTypeUpdateInput input = new LeaveTypeUpdateInput();
        input.setCode("CP");
        input.setLabel("Congés payés modifiés");

        LeaveType updated = new LeaveType();
        updated.setCode("CP");
        updated.setLabel("Congés payés modifiés");

        when(service.update("CP", "Congés payés modifiés")).thenReturn(updated);

        LeaveType result = controller.updateLeaveType(input);

        assertEquals("CP", result.getCode());
        assertEquals("Congés payés modifiés", result.getLabel());
        verify(service).update("CP", "Congés payés modifiés");
    }

    @Test
    void testDeleteLeaveType_Success() {
        when(service.delete("RTT")).thenReturn(true);

        Boolean result = controller.deleteLeaveType("RTT");

        assertTrue(result);
        verify(service).delete("RTT");
    }

    @Test
    void testGetByCode_ServiceThrowsException_Propagates() {
        when(service.getByCode("BAD")).thenThrow(new RuntimeException("Type not found"));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> controller.leaveType("BAD"));

        assertEquals("Type not found", ex.getMessage());
        verify(service).getByCode("BAD");
    }

    @Test
    void testCreateLeaveType_ServiceThrowsException_Propagates() {
        LeaveTypeCreateInput input = new LeaveTypeCreateInput();
        input.setCode("ERR");
        input.setLabel("Erreur");

        when(service.create("ERR", "Erreur")).thenThrow(new RuntimeException("Duplicate code"));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> controller.createLeaveType(input));

        assertEquals("Duplicate code", ex.getMessage());
        verify(service).create("ERR", "Erreur");
    }
}
