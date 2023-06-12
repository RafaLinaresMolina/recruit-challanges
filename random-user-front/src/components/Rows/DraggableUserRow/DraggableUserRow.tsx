import { UserRowProps } from "../UserRowProps";
import { Draggable } from 'react-beautiful-dnd';
import styles from "../../UserTable/UserTable.module.scss";


const DraggableUserRow: React.FC<UserRowProps & { index: number }> = ({ user, handleSelect, selected, index }) => (
    <Draggable draggableId={user.email} index={index}>
        {(provided) => (
            <tr
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                className={selected ? styles.selected : ''}
            >
                <td>
                    <input type="checkbox" onChange={() => handleSelect(user)} checked={selected} />
                </td>
                <td>{user.name.first} {user.name.last}</td>
                <td>{user.gender}</td>
                <td>{user.email}</td>
            </tr>
        )}
    </Draggable>
);


export default DraggableUserRow;