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
  Select,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Input,
  FormControl,
  FormLabel,
  VStack,
  Text,
  Textarea,
  IconButton,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiTrash2, FiEdit2 } from 'react-icons/fi';
import { announcementsApi } from '../services/api';
import { Announcement } from '../types';

const typeColors: Record<string, string> = {
  general: 'blue',
  homework: 'purple',
  event: 'green',
  urgent: 'red',
  daily_task: 'orange',
};

export const Announcements = () => {
  const [editAnnouncement, setEditAnnouncement] = useState<Announcement | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue } = useForm();

  const { data: announcements, isLoading } = useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: async () => {
      const res = await announcementsApi.getAll();
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => announcementsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast({ title: 'Announcement created', status: 'success' });
      handleClose();
    },
    onError: () => {
      toast({ title: 'Failed to create announcement', status: 'error' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => announcementsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast({ title: 'Announcement updated', status: 'success' });
      handleClose();
    },
    onError: () => {
      toast({ title: 'Failed to update announcement', status: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => announcementsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast({ title: 'Announcement deleted', status: 'success' });
    },
    onError: () => {
      toast({ title: 'Failed to delete announcement', status: 'error' });
    },
  });

  const handleClose = () => {
    setEditAnnouncement(null);
    reset();
    onClose();
  };

  const openEditModal = (announcement: Announcement) => {
    setEditAnnouncement(announcement);
    setValue('title', announcement.title);
    setValue('content', announcement.content);
    setValue('type', announcement.type);
    setValue('targetAudience', announcement.targetAudience);
    setValue('targetClass', announcement.targetClass || '');
    setValue('publishDate', announcement.publishDate.split('T')[0]);
    setValue('expiryDate', announcement.expiryDate?.split('T')[0] || '');
    setValue('isActive', announcement.isActive);
    onOpen();
  };

  const onSubmit = (data: any) => {
    const payload = {
      ...data,
      publishDate: new Date(data.publishDate).toISOString(),
      expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString() : undefined,
      isActive: data.isActive === 'true' || data.isActive === true,
    };

    if (editAnnouncement) {
      updateMutation.mutate({ id: editAnnouncement._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isLoading) {
    return (
      <Center h="400px">
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg">Announcements</Heading>
        <Button colorScheme="brand" onClick={onOpen}>
          Create Announcement
        </Button>
      </HStack>

      <Box bg="white" borderRadius="lg" shadow="sm" p={4}>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Title</Th>
              <Th>Type</Th>
              <Th>Target</Th>
              <Th>Status</Th>
              <Th>Publish Date</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {announcements?.map((announcement) => (
              <Tr key={announcement._id}>
                <Td>
                  <Text fontWeight="medium">{announcement.title}</Text>
                  <Text fontSize="sm" color="gray.500" noOfLines={1}>
                    {announcement.content}
                  </Text>
                </Td>
                <Td>
                  <Badge colorScheme={typeColors[announcement.type]}>
                    {announcement.type.replace('_', ' ')}
                  </Badge>
                </Td>
                <Td>
                  <Text>{announcement.targetAudience}</Text>
                  {announcement.targetClass && (
                    <Text fontSize="sm" color="gray.500">
                      {announcement.targetClass}
                    </Text>
                  )}
                </Td>
                <Td>
                  <Badge colorScheme={announcement.isActive ? 'green' : 'gray'}>
                    {announcement.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </Td>
                <Td>{new Date(announcement.publishDate).toLocaleDateString()}</Td>
                <Td>
                  <HStack>
                    <IconButton
                      aria-label="Edit"
                      icon={<FiEdit2 />}
                      size="sm"
                      onClick={() => openEditModal(announcement)}
                    />
                    <IconButton
                      aria-label="Delete"
                      icon={<FiTrash2 />}
                      size="sm"
                      colorScheme="red"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this announcement?')) {
                          deleteMutation.mutate(announcement._id);
                        }
                      }}
                    />
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      <Modal isOpen={isOpen} onClose={handleClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Title</FormLabel>
                  <Input {...register('title')} placeholder="Announcement title" />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Content</FormLabel>
                  <Textarea {...register('content')} placeholder="Announcement content" rows={4} />
                </FormControl>

                <HStack w="100%" spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Type</FormLabel>
                    <Select {...register('type')} defaultValue="general">
                      <option value="general">General</option>
                      <option value="homework">Homework</option>
                      <option value="event">Event</option>
                      <option value="urgent">Urgent</option>
                      <option value="daily_task">Daily Task</option>
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Target Audience</FormLabel>
                    <Select {...register('targetAudience')} defaultValue="all">
                      <option value="all">All</option>
                      <option value="parents">Parents Only</option>
                      <option value="teachers">Teachers Only</option>
                      <option value="class">Specific Class</option>
                    </Select>
                  </FormControl>
                </HStack>

                <FormControl>
                  <FormLabel>Target Class (if applicable)</FormLabel>
                  <Select {...register('targetClass')} placeholder="Select class">
                    <option value="">All Classes</option>
                    <option value="LKG">LKG</option>
                    <option value="UKG">UKG</option>
                    <option value="Class 1">Class 1</option>
                    <option value="Class 2">Class 2</option>
                    <option value="Class 3">Class 3</option>
                    <option value="Class 4">Class 4</option>
                    <option value="Class 5">Class 5</option>
                  </Select>
                </FormControl>

                <HStack w="100%" spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Publish Date</FormLabel>
                    <Input type="date" {...register('publishDate')} />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Expiry Date</FormLabel>
                    <Input type="date" {...register('expiryDate')} />
                  </FormControl>
                </HStack>

                <FormControl>
                  <FormLabel>Status</FormLabel>
                  <Select {...register('isActive')} defaultValue="true">
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </Select>
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="brand"
                  w="100%"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                >
                  {editAnnouncement ? 'Update' : 'Create'} Announcement
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};
