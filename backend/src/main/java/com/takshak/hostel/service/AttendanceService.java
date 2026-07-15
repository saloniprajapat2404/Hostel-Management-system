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
import org.springframework.transaction.annotation.Transactional;

@Service
public class AttendanceService {

    private final CheckInOutRepository checkInOutRepository;
    private final UserService userService;

    public AttendanceService(CheckInOutRepository checkInOutRepository, UserService userService) {
        this.checkInOutRepository = checkInOutRepository;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public List<AttendanceDto> list() {
        return checkInOutRepository.findAllDetailed().stream().map(this::toDto).toList();
    }

    @Transactional
    public AttendanceDto record(CreateAttendanceRequest request) {
        User student = userService.requireStudent(request.studentId());
        CheckInOut record = new CheckInOut();
        record.setStudent(student);
        record.setType(request.type());
        record.setTimestamp(Instant.now());
        record.setRecordedBy(SecurityUtils.currentUser());
        record.setNotes(request.notes());
        return toDto(checkInOutRepository.save(record));
    }

    private AttendanceDto toDto(CheckInOut c) {
        User recordedBy = c.getRecordedBy();
        return new AttendanceDto(
                c.getId(),
                c.getStudent().getId(),
                c.getStudent().getFullName(),
                c.getStudent().getStudentId(),
                c.getType(),
                c.getTimestamp(),
                recordedBy != null ? recordedBy.getId() : null,
                recordedBy != null ? recordedBy.getFullName() : null,
                c.getNotes()
        );
    }
}
