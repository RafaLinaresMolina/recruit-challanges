import { Droppable } from 'react-beautiful-dnd';
import styles from './../../UserTable/UserTable.module.scss';
import UserRow from '../../Rows/UserRow/UserRow';
import { User } from '../../../types/User';

interface UserTableToDropProps {
    dragedUsers: User[];
    handleSelect: (user: User) => void;
    selectedRows: User[];
    exportDragedToCSV: () => void;
}

const UserTableToDrop: React.FC<UserTableToDropProps> = ({ dragedUsers, handleSelect, selectedRows, exportDragedToCSV }) => {
    return (
        <div className={styles.tableContainer}>
            <button onClick={exportDragedToCSV}>Export dragged users to CSV</button>
            <Droppable droppableId="draggedUsers">
                {(provided) => (
                    <table
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={styles.table}
                    >
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Gender</th>
                                <th>Email</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dragedUsers.map((user, index) => (
                                <UserRow
                                    user={user}
                                    handleSelect={handleSelect}
                                    selected={selectedRows.includes(user)}
                                    key={user.email}
                                />
                            ))}
                            {provided.placeholder}
                        </tbody>
                    </table>
                )}
            </Droppable>
        </div>
    );
}

export default UserTableToDrop;