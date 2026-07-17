package com.takshak.hostel.repository;

import com.takshak.hostel.entity.Room;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface RoomRepository extends MongoRepository<Room, String> {
    Optional<Room> findByRoomNumberIgnoreCase(String roomNumber);
    boolean existsByRoomNumberIgnoreCase(String roomNumber);
    List<Room> findByActiveTrueOrderByRoomNumberAsc();
    List<Room> findAllByOrderByRoomNumberAsc();
    long countByActiveTrue();
}
