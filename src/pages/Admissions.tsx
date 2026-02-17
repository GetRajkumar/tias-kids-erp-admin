import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  HStack,
  Spinner,
  Center,
  useToast,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Textarea,
  Text,
  VStack,
  Icon,
  Link,
  FormControl,
  FormLabel,
  IconButton,
  Tooltip,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { admissionsApi } from '../services/api';
import { Admission, AdmissionComment } from '../types';
import { useAuth } from '../hooks/useAuth';
import { 
  FiEye, 
  FiMessageSquare, 
  FiEdit3, 
  FiSearch,
  FiFilter 
} from 'react-icons/fi';

const statusColors: Record<string, string> = {
  pending: 'yellow',
  under_review: 'blue',
  approved: 'green',
  rejected: 'red',
};

export const Admissions = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [selected, setSelected] = useState<Admission | null>(null);
  const [comment, setComment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [commentsHistory, setCommentsHistory] = useState<AdmissionComment[]>([]);
  const [isDirectComment, setIsDirectComment] = useState(false);
  const { isOpen: isCommentOpen, onOpen: onCommentOpen, onClose: onCommentClose } = useDisclosure();
  const { isOpen: isDetailsOpen, onOpen: onDetailsOpen, onClose: onDetailsClose } = useDisclosure();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: admissions, isLoading } = useQuery<Admission[]>({
    queryKey: ['admissions'],
    queryFn: async () => {
      const res = await admissionsApi.getAll();
      return res.data;
    },
  });

  // Filter admissions based on all filters
  const filteredAdmissions = useMemo(() => {
    if (!admissions) return [];
    
    return admissions.filter((admission) => {
      // Status filter
      if (statusFilter && admission.status !== statusFilter) return false;
      
      // Class filter
      if (classFilter && admission.preferredClass !== classFilter) return false;
      
      // Search filter (search in child name, parent name, email, phone)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const childName = `${admission.childFirstName} ${admission.childLastName}`.toLowerCase();
        const parentName = `${admission.parentFirstName} ${admission.parentLastName}`.toLowerCase();
        const email = admission.parentEmail.toLowerCase();
        const phone = admission.parentPhone.toLowerCase();
        
        if (
          !childName.includes(query) &&
          !parentName.includes(query) &&
          !email.includes(query) &&
          !phone.includes(query)
        ) {
          return false;
        }
      }
      
      return true;
    });
  }, [admissions, statusFilter, classFilter, searchQuery]);

  // Get unique classes for filter
  const availableClasses = useMemo(() => {
    if (!admissions) return [];
    const classes = new Set(admissions.map(a => a.preferredClass).filter(Boolean));
    return Array.from(classes).sort();
  }, [admissions]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, comment }: { id: string; status: string; comment: string }) =>
      admissionsApi.updateStatus(id, status, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      toast({
        title: 'Status updated successfully',
        status: 'success',
      });
      onCommentClose();
      setComment('');
      setSelectedStatus('');
      setIsDirectComment(false);
    },
    onError: () => {
      toast({
        title: 'Failed to update status',
        status: 'error',
      });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      admissionsApi.addComment(id, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      toast({
        title: 'Comment added successfully',
        status: 'success',
      });
      onCommentClose();
      setComment('');
      setIsDirectComment(false);
    },
    onError: () => {
      toast({
        title: 'Failed to add comment',
        status: 'error',
      });
    },
  });

  const handleStatusChange = (admission: Admission, newStatus: string) => {
    setSelected(admission);
    setSelectedStatus(newStatus);
    setIsDirectComment(false);
    onCommentOpen();
  };

  const handleAddComment = (admission: Admission) => {
    setSelected(admission);
    setIsDirectComment(true);
    onCommentOpen();
  };

  const handleSubmitComment = () => {
    if (!selected || !comment) return;

    if (isDirectComment) {
      addCommentMutation.mutate({
        id: selected._id,
        comment,
      });
    } else if (selectedStatus) {
      updateStatusMutation.mutate({
        id: selected._id,
        status: selectedStatus,
        comment,
      });
    }
  };

  const handleViewDetails = async (admission: Admission) => {
    setSelected(admission);
    try {
      const res = await admissionsApi.getComments(admission._id);
      setCommentsHistory(res.data);
      onDetailsOpen();
    } catch (error) {
      toast({
        title: 'Failed to fetch comments',
        status: 'error',
      });
    }
  };

  const canManageAdmissions = user?.role === 'super_admin' || user?.role === 'admin';

  if (isLoading) {
    return (
      <Center h="400px">
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }

  return (
    <Box>
      <VStack spacing={4} align="stretch" mb={6}>
        <HStack justify="space-between">
          <Heading size="lg">Admissions</Heading>
          <HStack spacing={3}>
            <InputGroup maxW="300px">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiSearch} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search by name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
            <Select
              maxW="180px"
              placeholder="All Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              icon={<FiFilter />}
            >
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </Select>
            <Select
              maxW="180px"
              placeholder="All Classes"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              icon={<FiFilter />}
            >
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </Select>
          </HStack>
        </HStack>
        <Text fontSize="sm" color="gray.600">
          Showing {filteredAdmissions.length} of {admissions?.length || 0} enquiries
        </Text>
      </VStack>

      <Box bg="white" borderRadius="lg" shadow="sm" p={4} overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Child Name</Th>
              <Th>Parent</Th>
              <Th>Contact</Th>
              <Th>Preferred Class</Th>
              <Th>Status</Th>
              <Th>Updated Date</Th>
              <Th textAlign="center">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredAdmissions.length === 0 ? (
              <Tr>
                <Td colSpan={7} textAlign="center" py={8}>
                  <Text color="gray.500">No enquiries found</Text>
                </Td>
              </Tr>
            ) : (
              filteredAdmissions.map((admission) => (
                <Tr key={admission._id}>
                  <Td>
                    <Text fontWeight="medium">
                      {admission.childFirstName} {admission.childLastName}
                    </Text>
                  </Td>
                  <Td>
                    {admission.parentFirstName} {admission.parentLastName}
                  </Td>
                  <Td>
                    <Text fontSize="sm">{admission.parentEmail}</Text>
                    <Text fontSize="sm" color="gray.500">
                      {admission.parentPhone}
                    </Text>
                  </Td>
                  <Td>{admission.preferredClass || '-'}</Td>
                  <Td>
                    <Badge colorScheme={statusColors[admission.status]}>
                      {admission.status.replace('_', ' ')}
                    </Badge>
                  </Td>
                  <Td>
                    <Text fontSize="sm">
                      {new Date(admission.updatedAt).toLocaleDateString()}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {new Date(admission.updatedAt).toLocaleTimeString()}
                    </Text>
                  </Td>
                  <Td>
                    <HStack spacing={1} justify="center">
                      <Tooltip label="View Details" placement="top">
                        <IconButton
                          aria-label="View details"
                          icon={<Icon as={FiEye} />}
                          size="sm"
                          variant="ghost"
                          colorScheme="blue"
                          onClick={() => handleViewDetails(admission)}
                        />
                      </Tooltip>

                      {canManageAdmissions && admission.status !== 'approved' && (
                        <>
                          <Tooltip label="Add Comment" placement="top">
                            <IconButton
                              aria-label="Add comment"
                              icon={<Icon as={FiMessageSquare} />}
                              size="sm"
                              variant="ghost"
                              colorScheme="green"
                              onClick={() => handleAddComment(admission)}
                            />
                          </Tooltip>

                          <Menu>
                            <Tooltip label="Change Status" placement="top">
                              <MenuButton
                                as={IconButton}
                                aria-label="Change status"
                                icon={<Icon as={FiEdit3} />}
                                size="sm"
                                variant="ghost"
                                colorScheme="orange"
                              />
                            </Tooltip>
                            <MenuList>
                              <MenuItem onClick={() => handleStatusChange(admission, 'pending')}>
                                <Badge colorScheme="yellow" mr={2}>pending</Badge>
                              </MenuItem>
                              <MenuItem onClick={() => handleStatusChange(admission, 'under_review')}>
                                <Badge colorScheme="blue" mr={2}>under review</Badge>
                              </MenuItem>
                              <MenuItem onClick={() => handleStatusChange(admission, 'approved')}>
                                <Badge colorScheme="green" mr={2}>approved</Badge>
                              </MenuItem>
                              <MenuItem onClick={() => handleStatusChange(admission, 'rejected')}>
                                <Badge colorScheme="red" mr={2}>rejected</Badge>
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </>
                      )}
                    </HStack>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Comment Modal */}
      <Modal isOpen={isCommentOpen} onClose={onCommentClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {isDirectComment ? 'Add Comment' : 'Update Status'} - {selected?.childFirstName} {selected?.childLastName}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {!isDirectComment && (
                <FormControl>
                  <FormLabel>New Status</FormLabel>
                  <Badge colorScheme={statusColors[selectedStatus]} fontSize="md" p={2}>
                    {selectedStatus.replace('_', ' ')}
                  </Badge>
                </FormControl>
              )}
              {isDirectComment && (
                <FormControl>
                  <FormLabel>Current Status</FormLabel>
                  <Badge colorScheme={statusColors[selected?.status || '']} fontSize="md" p={2}>
                    {selected?.status.replace('_', ' ')}
                  </Badge>
                </FormControl>
              )}
              <FormControl isRequired>
                <FormLabel>Comment</FormLabel>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    isDirectComment
                      ? 'Add your comment here...'
                      : 'Please provide a comment for this status change...'
                  }
                  rows={4}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCommentClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmitComment}
              isLoading={updateStatusMutation.isPending || addCommentMutation.isPending}
              isDisabled={!comment}
            >
              {isDirectComment ? 'Add Comment' : 'Update Status'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={onDetailsClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Admission Details - {selected?.childFirstName} {selected?.childLastName}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontWeight="bold" mb={2}>Current Status:</Text>
                <Badge colorScheme={statusColors[selected?.status || '']} fontSize="md" p={2}>
                  {selected?.status.replace('_', ' ')}
                </Badge>
              </Box>
              <Box>
                <Text fontWeight="bold" mb={2}>Comments History:</Text>
                {commentsHistory.length === 0 ? (
                  <Text color="gray.500">No comments yet</Text>
                ) : (
                  <VStack spacing={3} align="stretch">
                    {commentsHistory.map((item, index) => (
                      <Box
                        key={index}
                        p={3}
                        borderWidth="1px"
                        borderRadius="md"
                        bg="gray.50"
                      >
                        <HStack justify="space-between" mb={2}>
                          <Badge colorScheme={statusColors[item.status]}>
                            {item.status.replace('_', ' ')}
                          </Badge>
                          <Text fontSize="xs" color="gray.500">
                            {new Date(item.commentedAt).toLocaleString()}
                          </Text>
                        </HStack>
                        <Text fontSize="sm" mb={1}>{item.comment}</Text>
                        <Text fontSize="xs" color="gray.600">
                          By: {item.commentedBy.firstName} {item.commentedBy.lastName}
                        </Text>
                      </Box>
                    ))}
                  </VStack>
                )}
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onDetailsClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};
