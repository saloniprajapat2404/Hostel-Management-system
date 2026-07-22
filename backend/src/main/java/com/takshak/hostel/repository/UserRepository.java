package com.takshak.hostel.repository;

import com.takshak.hostel.entity.User;
import com.takshak.hostel.enums.Role;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmailIgnoreCase(String email);
    Optional<User> findByStudentIdIgnoreCase(String studentId);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByStudentIdIgnoreCase(String studentId);
    boolean existsByEmailIgnoreCaseAndBranchId(String email, String branchId);
    boolean existsByStudentIdIgnoreCaseAndBranchId(String studentId, String branchId);
    Optional<User> findByEmailIgnoreCaseAndBranchId(String email, String branchId);
    Optional<User> findByStudentIdIgnoreCaseAndBranchId(String studentId, String branchId);
    List<User> findByRole(Role role);
    List<User> findByRoleIn(List<Role> roles);
    List<User> findByRoleAndBranchId(Role role, String branchId);
    List<User> findByRoleInAndBranchId(List<Role> roles, String branchId);
    List<User> findByBranchId(String branchId);
    long countByRoleAndActiveTrue(Role role);
    long countByRoleAndActiveTrueAndBranchId(Role role, String branchId);
}
