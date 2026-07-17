package com.takshak.hostel.service;

import com.takshak.hostel.dto.AttendanceDto;
import com.takshak.hostel.dto.CreateAttendanceRequest;
import com.takshak.hostel.entity.CheckInOut;
import com.takshak.hostel.entity.User;
import com.takshak.hostel.repository.CheckInOutRepository;
import com.takshak.hostel.security.SecurityUtils;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AttendanceService {

    private final CheckInOutRepository checkInOutRepository;
    private final UserService userService;

    public AttendanceService(CheckInOutRepository checkInOutRepository, UserService userService) {
        this.checkInOutRepository = checkInOutRepository;
        this.userService = userService;
    }

    public List<AttendanceDto> list() {
        return checkInOutRepository.findAllByOrderByTimestampDesc().stream().map(this::toDto).toList();
    }

    public AttendanceDto record(CreateAttendanceRequest request) {
        User student = userService.requireStudent(request.studentId());
        User actor = SecurityUtils.currentUser();
        CheckInOut record = new CheckInOut();
        record.setStudentId(student.getId());
        record.setStudentName(student.getFullName());
        record.setStudentCode(student.getStudentId());
        record.setType(request.type());
        record.setTimestamp(Instant.now());
        record.setRecordedById(actor.getId());
        record.setRecordedByName(actor.getFullName());
        record.setNotes(request.notes());
        return toDto(checkInOutRepository.save(record));
    }

    private AttendanceDto toDto(CheckInOut c) {
        return new AttendanceDto(
                c.getId(),
                c.getStudentId(),
                c.getStudentName(),
                c.getStudentCode(),
                c.getType(),
                c.getTimestamp(),
                c.getRecordedById(),
                c.getRecordedByName(),
                c.getNotes()
        );
    }
}
