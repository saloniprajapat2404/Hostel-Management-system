package com.takshak.hostel.repository;

import com.takshak.hostel.entity.Room;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface RoomRepository extends JpaRepository<Room, Long> {
    Optional<Room> findByRoomNumberIgnoreCase(String roomNumber);
    boolean existsByRoomNumberIgnoreCase(String roomNumber);
    List<Room> findByActiveTrueOrderByRoomNumberAsc();

    @Query("SELECT DISTINCT r FROM Room r LEFT JOIN FETCH r.beds ORDER BY r.roomNumber")
    List<Room> findAllWithBeds();

    long countByActiveTrue();
}
