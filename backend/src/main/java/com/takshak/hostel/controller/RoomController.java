package com.takshak.hostel.controller;

import com.takshak.hostel.dto.BulkCreateRoomsRequest;
import com.takshak.hostel.dto.CreateRoomRequest;
import com.takshak.hostel.dto.RoomDto;
import com.takshak.hostel.dto.UpdateBedRequest;
import com.takshak.hostel.dto.UpdateRoomRequest;
import com.takshak.hostel.service.RoomService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','WARDEN')")
    public List<RoomDto> list() {
        return roomService.listRooms();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','WARDEN')")
    public RoomDto get(@PathVariable String id) {
        return roomService.getRoom(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public RoomDto create(@Valid @RequestBody CreateRoomRequest request) {
        return roomService.createRoom(request);
    }

    @PostMapping("/bulk")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public List<RoomDto> bulkCreate(@Valid @RequestBody BulkCreateRoomsRequest request) {
        return roomService.bulkCreateRooms(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public RoomDto update(@PathVariable String id, @RequestBody UpdateRoomRequest request) {
        return roomService.updateRoom(id, request);
    }

    @PutMapping("/{roomId}/beds/{bedId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public RoomDto updateBed(
            @PathVariable String roomId,
            @PathVariable String bedId,
            @RequestBody UpdateBedRequest request) {
        return roomService.updateBed(roomId, bedId, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public void delete(@PathVariable String id) {
        roomService.deleteRoom(id);
    }
}
