package com.takshak.hostel.repository;

import com.takshak.hostel.entity.User;
import com.takshak.hostel.enums.Role;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);
    Optional<User> findByStudentIdIgnoreCase(String studentId);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByStudentIdIgnoreCase(String studentId);
    List<User> findByRole(Role role);
    List<User> findByRoleIn(List<Role> roles);
    long countByRoleAndActiveTrue(Role role);
}
