package com.takshak.hostel.repository;

import com.takshak.hostel.entity.CheckInOut;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CheckInOutRepository extends MongoRepository<CheckInOut, String> {
    List<CheckInOut> findAllByOrderByTimestampDesc();
}
