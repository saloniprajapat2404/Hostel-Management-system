package com.takshak.hostel.repository;

import com.takshak.hostel.entity.Room;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface RoomRepository extends MongoRepository<Room, String> {
    Optional<Room> findByRoomNumberIgnoreCase(String roomNumber);
    Optional<Room> findByBranchIdAndRoomNumberIgnoreCase(String branchId, String roomNumber);
    boolean existsByRoomNumberIgnoreCase(String roomNumber);
    boolean existsByBranchIdAndRoomNumberIgnoreCase(String branchId, String roomNumber);
    List<Room> findByActiveTrueOrderByRoomNumberAsc();
    List<Room> findByBranchIdOrderByRoomNumberAsc(String branchId);
    List<Room> findByBranchIdAndActiveTrueOrderByRoomNumberAsc(String branchId);
    List<Room> findAllByOrderByRoomNumberAsc();
    long countByActiveTrue();
    long countByBranchIdAndActiveTrue(String branchId);
}
